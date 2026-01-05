// CQC Key Lines of Enquiry (KLOEs) for Adult Social Care
export const CQC_KLOES = [
  // Safe
  { value: "safe_safeguarding", label: "Safe: Safeguarding and protection from abuse", category: "safe" },
  { value: "safe_managing_risks", label: "Safe: Managing risks", category: "safe" },
  { value: "safe_staff_cover", label: "Safe: Suitable staff and staff cover", category: "safe" },
  { value: "safe_medicines", label: "Safe: Medicines management", category: "safe" },
  { value: "safe_infection_control", label: "Safe: Infection control", category: "safe" },
  { value: "safe_learning", label: "Safe: Learning when things go wrong", category: "safe" },
  
  // Effective
  { value: "effective_assessing_needs", label: "Effective: Assessing needs and delivering evidence-based treatment", category: "effective" },
  { value: "effective_staff_skills", label: "Effective: Staff skills and knowledge", category: "effective" },
  { value: "effective_nutrition", label: "Effective: Nutrition and hydration", category: "effective" },
  { value: "effective_working_together", label: "Effective: How staff, teams and services work together", category: "effective" },
  { value: "effective_healthier_lives", label: "Effective: Supporting people to live healthier lives", category: "effective" },
  { value: "effective_accessible_premises", label: "Effective: Accessible premises", category: "effective" },
  { value: "effective_consent", label: "Effective: Consent to care and treatment", category: "effective" },
  
  // Caring
  { value: "caring_kindness", label: "Caring: Kindness, respect and compassion", category: "caring" },
  { value: "caring_involving_people", label: "Caring: Involving people in decisions about their care", category: "caring" },
  { value: "caring_privacy", label: "Caring: Privacy and dignity", category: "caring" },
  
  // Responsive
  { value: "responsive_person_centred", label: "Responsive: Person-centred care", category: "responsive" },
  { value: "responsive_complaints", label: "Responsive: Concerns and complaints", category: "responsive" },
  { value: "responsive_end_of_life", label: "Responsive: End of life care", category: "responsive" },
  
  // Well-led
  { value: "well_led_vision", label: "Well-led: Vision and strategy", category: "well_led" },
  { value: "well_led_governance", label: "Well-led: Governance and management", category: "well_led" },
  { value: "well_led_engagement", label: "Well-led: Engagement and involvement", category: "well_led" },
  { value: "well_led_learning", label: "Well-led: Learning, improvement and innovation", category: "well_led" },
  { value: "well_led_partnership", label: "Well-led: Working in partnership", category: "well_led" },
] as const;

export type KloeValue = typeof CQC_KLOES[number]['value'];
export type KloeCategory = typeof CQC_KLOES[number]['category'];
