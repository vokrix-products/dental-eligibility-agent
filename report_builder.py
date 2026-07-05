def build_report(result, patient_label):
    fields = result['fields']
    lines = []
    lines.append(f"Benefits Verification Report for {patient_label}")
    lines.append("=" * 60)
    lines.append(f"Carrier Name: {fields.get('carrier_name', 'unknown')}")
    lines.append(f"Member ID: {fields.get('member_id', 'unknown')}")
    lines.append(f"Group Number: {fields.get('group_number', 'unknown')}")
    lines.append(f"Subscriber Name: {fields.get('subscriber_name', 'unknown')}")
    lines.append(f"Plan Type: {fields.get('plan_type', 'unknown')}")
    lines.append(f"Annual Maximum: {fields.get('annual_maximum', 'unknown')}")
    lines.append(f"Deductible (Individual): {fields.get('deductible_individual', 'unknown')}")
    lines.append(f"Deductible (Family): {fields.get('deductible_family', 'unknown')}")
    lines.append(f"Coverage Preventive %: {fields.get('coverage_preventive_pct', 'unknown')}")
    lines.append(f"Coverage Basic %: {fields.get('coverage_basic_pct', 'unknown')}")
    lines.append(f"Coverage Major %: {fields.get('coverage_major_pct', 'unknown')}")
    lines.append(f"Ortho Coverage: {fields.get('ortho_coverage', 'unknown')}")
    lines.append(f"Effective Date: {fields.get('effective_date', 'unknown')}")
    lines.append(f"Notes: {fields.get('notes', 'unknown')}")
    lines.append("-" * 60)
    completeness = result['completeness_pct']
    status = result['status']
    lines.append(f"Completeness: {completeness}%")
    lines.append(f"Status: {status}")
    return '\n'.join(lines)

def build_summary(result):
    fields = result['fields']
    return {
        'carrier_name': fields.get('carrier_name', 'unknown'),
        'member_id': fields.get('member_id', 'unknown'),
        'status': result['status'],
        'completeness_pct': result['completeness_pct']
    }
