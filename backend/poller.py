import os
import sys
import time
import json
import tempfile
import logging
from datetime import datetime, timezone

import requests


from extractor import extract as extract_fields
from report_builder import build_report, build_summary

PRODUCT_ID = "dental-eligibility-agent"
JOB_TYPE = "process_upload"
MODEL = "claude-haiku-4-5-20251001"
POLL_INTERVAL = 60

SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def supabase_headers():
    return {
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal"
    }


def fetch_pending_jobs():
    url = f"{SUPABASE_URL}/rest/v1/jobs"
    params = {
        "status": "eq.pending",
        "job_type": f"eq.{JOB_TYPE}",
        "product_id": f"eq.{PRODUCT_ID}"
    }
    resp = requests.get(url, headers=supabase_headers(), params=params)
    resp.raise_for_status()
    return resp.json()


def download_file(file_path):
    url = f"{SUPABASE_URL}/storage/v1/object/uploads/{file_path}"
    resp = requests.get(url, headers=supabase_headers())
    resp.raise_for_status()
    return resp.content


def upload_result(result_path, content_bytes, content_type="text/plain"):
    url = f"{SUPABASE_URL}/storage/v1/object/results/{result_path}"
    headers = supabase_headers()
    headers["Content-Type"] = content_type
    resp = requests.post(url, headers=headers, data=content_bytes)
    resp.raise_for_status()
    return result_path


def insert_record(record_data):
    url = f"{SUPABASE_URL}/rest/v1/records"
    resp = requests.post(url, headers=supabase_headers(), json=record_data)
    resp.raise_for_status()


def update_job(job_id, update_data):
    url = f"{SUPABASE_URL}/rest/v1/jobs"
    headers = supabase_headers()
    headers["Prefer"] = "return=minimal"
    params = {"id": f"eq.{job_id}"}
    resp = requests.patch(url, headers=headers, params=params, json=update_data)
    resp.raise_for_status()


def process_job(job):
    job_id = job.get("id")
    customer_id = job.get("customer_id")
    input_file_path = job.get("file_path", "")

    if not input_file_path:
        raise ValueError("Job has no file_path")

    file_bytes = download_file(input_file_path)
    ext = os.path.splitext(input_file_path)[1].lower() or ".bin"
    with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp:
        tmp.write(file_bytes)
        temp_path = tmp.name

    try:
        result = extract_fields(temp_path)
        result_summary = build_summary(result)
        carrier = result_summary.get("carrier_name", "Unknown")
        member = result_summary.get("member_id", "Unknown")
        title = f"{carrier} - {member}"
        record_data = {
            "product_id": PRODUCT_ID,
            "customer_id": customer_id,
            "title": title,
            "status": result.get("status", "needs_review"),
            "details": json.dumps(result.get("fields", {})),
            "source_file_path": input_file_path,
            "due_date": None
        }
        insert_record(record_data)

        report_text = build_report(result, title)
        result_path = f"{job_id}.txt"
        upload_result(result_path, report_text.encode("utf-8"))

        now_utc = datetime.now(timezone.utc).isoformat()
        update_job(job_id, {
            "status": "completed",
            "output_file_path": result_path,
            "result_summary": json.dumps(result_summary),
            "completed_at": now_utc
        })
        logger.info(f"Job {job_id} completed successfully")
    finally:
        os.unlink(temp_path)


def main():
    logger.info(f"Poller starting for product {PRODUCT_ID}")
    while True:
        try:
            jobs = fetch_pending_jobs()
            for job in jobs:
                try:
                    process_job(job)
                except Exception as e:
                    job_id = job.get("id")
                    error_msg = str(e)[:500]
                    update_job(job_id, {
                        "status": "failed",
                        "error_message": error_msg
                    })
                    logger.error(f"Job {job_id} failed: {error_msg}")
        except Exception as e:
            logger.error(f"Poll cycle error: {e}")
        time.sleep(POLL_INTERVAL)


if __name__ == "__main__":
    main()
