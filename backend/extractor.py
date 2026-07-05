import os
import json
import base64
from anthropic import Anthropic

def extract(file_path):
    ext = os.path.splitext(file_path)[1].lower()
    client = Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])
    system_prompt = (
        "You are a dental insurance data extractor. "
        "Return ONLY a JSON object with these exact keys: "
        "carrier_name, member_id, group_number, subscriber_name, plan_type, "
        "annual_maximum, deductible_individual, deductible_family, "
        "coverage_preventive_pct, coverage_basic_pct, coverage_major_pct, "
        "ortho_coverage, effective_date, notes. "
        "If a value is unknown, set it to the string 'unknown'."
    )
    if ext in ('.jpg', '.jpeg', '.png'):
        with open(file_path, 'rb') as f:
            data = f.read()
        b64 = base64.b64encode(data).decode('utf-8')
        msg = client.messages.create(
            model='claude-haiku-4-5-20251001',
            max_tokens=1024,
            system=system_prompt,
            messages=[
                {
                    'role': 'user',
                    'content': [
                        {
                            'type': 'image',
                            'source': {
                                'type': 'base64',
                                'media_type': 'image/png' if ext == '.png' else 'image/jpeg',
                                'data': b64
                            }
                        },
                        {
                            'type': 'text',
                            'text': 'Extract the insurance and benefits information from this image.'
                        }
                    ]
                }
            ]
        )
    elif ext == '.pdf':
        with open(file_path, 'rb') as f:
            data = f.read()
        b64 = base64.b64encode(data).decode('utf-8')
        msg = client.messages.create(
            model='claude-haiku-4-5-20251001',
            max_tokens=1024,
            system=system_prompt,
            messages=[
                {
                    'role': 'user',
                    'content': [
                        {
                            'type': 'document',
                            'source': {
                                'type': 'base64',
                                'media_type': 'application/pdf',
                                'data': b64
                            }
                        },
                        {
                            'type': 'text',
                            'text': 'Extract the insurance and benefits information from this document.'
                        }
                    ]
                }
            ]
        )
    elif ext == '.txt':
        with open(file_path, 'r') as f:
            text = f.read()
        msg = client.messages.create(
            model='claude-haiku-4-5-20251001',
            max_tokens=1024,
            system=system_prompt,
            messages=[
                {
                    'role': 'user',
                    'content': text
                }
            ]
        )
    else:
        raise ValueError(f'Unsupported file extension: {ext}')
    raw_text = msg.content[0].text
    try:
        fields = json.loads(raw_text)
    except json.JSONDecodeError:
        fields = {
            'carrier_name': 'unknown',
            'member_id': 'unknown',
            'group_number': 'unknown',
            'subscriber_name': 'unknown',
            'plan_type': 'unknown',
            'annual_maximum': 'unknown',
            'deductible_individual': 'unknown',
            'deductible_family': 'unknown',
            'coverage_preventive_pct': 'unknown',
            'coverage_basic_pct': 'unknown',
            'coverage_major_pct': 'unknown',
            'ortho_coverage': 'unknown',
            'effective_date': 'unknown',
            'notes': 'unknown',
            'raw_text': raw_text
        }
    known_count = sum(1 for v in fields.values() if v != 'unknown')
    completeness = round((known_count / 14) * 100)
    if completeness >= 70:
        status = 'verified'
    elif completeness >= 40:
        status = 'partial'
    else:
        status = 'needs_review'
    return {
        'fields': fields,
        'completeness_pct': completeness,
        'status': status
    }
