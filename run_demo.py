import json
from report_builder import build_report, build_summary

def main():
    fake_fields = {
        'carrier_name': 'Delta Dental',
        'member_id': 'DD123456789',
        'group_number': 'GRP-001',
        'subscriber_name': 'John Doe',
        'plan_type': 'PPO',
        'annual_maximum': '$1,500',
        'deductible_individual': '$50',
        'deductible_family': '$150',
        'coverage_preventive_pct': '100%',
        'coverage_basic_pct': '80%',
        'coverage_major_pct': '50%',
        'ortho_coverage': 'Not covered',
        'effective_date': '2024-01-01',
        'notes': 'Sample data for demo'
    }
    result = {
        'fields': fake_fields,
        'completeness_pct': 100,
        'status': 'verified'
    }
    report = build_report(result, 'Demo Patient')
    print(report)
    print()
    summary = build_summary(result)
    print(json.dumps(summary, indent=2))
    print('DEMO OK')

if __name__ == '__main__':
    main()
