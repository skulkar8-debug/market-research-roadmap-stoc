import type { AppData, Sector, CalendarEvent, SectorStatus, Priority } from './types'
import { WORKFLOW_EVENTS } from './workflowEvents'

// ─── helpers ─────────────────────────────────────────────────────────────────
function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().split('T')[0]
}

// ─── published asset links ────────────────────────────────────────────────────
const SECTOR_LINKS: Record<string, Partial<Sector>> = {
  S001: { // MedSpa
    dataLink:     'https://www.dropbox.com/scl/fo/m16rfrpa1pdpxkc3xzuhg/AFi81UySZO8tryqEYyOp8no?rlkey=kassl99rj8xwil5udal7s6dzo&st=ihhdsuvw&dl=0',
    reportLink:   'https://www.dropbox.com/scl/fi/6arwq3bqu6aqvs6ja0m2l/Medical-Aesthetics.pdf?rlkey=2uzv2mrfkdajb3ykfthf1qqc9&st=cxcavef6&dl=0',
    linkedinLink: 'https://www.linkedin.com/feed/update/urn:li:activity:7452439371573514240',
    websiteLink:  'https://www.stocadvisory.com/insights/reports/us-medical-aesthetics-2026',
  },
}

// ─── raw sector table ─────────────────────────────────────────────────────────
// [id, name, status, priority, publishDate, notes]
type Raw = [string, string, SectorStatus, Priority, string, string]

const RAW_SECTORS: Raw[] = [
  ['S001','MedSpa',              'Completed','High',  '2026-04-21','Provider/aesthetician capacity, service breadth, memberships, digital maturity.'],
  ['S002','Veterinary',          'Completed','High',  '2026-05-26','DVM count, staff count, service breadth, facility capacity, local consolidation.'],
  ['S003','Commercial Landscaping','Published','High','2026-06-11','Recurring commercial maintenance, route density, crew capacity, snow/ice diversification.'],
  ['S004','Pest Control',        'Planning', 'High',  '2026-06-30','Recurring route revenue, technician density, termite/wildlife specialization.'],
  ['S005','Funeral Homes',       'Planning', 'High',  '',          'Cremation capability, pre-need revenue, family-owned fragmentation.'],
  ['S006','Youth Sports',        'Planning', 'High',  '',          'Facility utilization, recurring registrations, tournaments, club networks.'],
  ['S007','Tire & Auto Repair',  'Planning', 'High',  '',          'Bay count, technician count, tire sales mix, fleet/commercial accounts.'],
  ['S008','Collision Repair',    'Planning', 'High',  '',          'Insurance relationships, OEM certifications, paint booth capacity.'],
  ['S009','Managed Service Provider (MSP)','Planning','High','',   'Recurring managed services, cybersecurity depth, technical headcount.'],
  ['S010','Security Services',   'Planning', 'High',  '',          'Guard force scale, recurring contracts, patrol/monitoring mix.'],
  ['S011','Garage Door Repair',  'Planning', 'High',  '',          'Technician density, emergency service, installation/repair mix.'],
  ['S012','Behavioral Health',   'Planning', 'High',  '',          'Clinician capacity, payer mix, specialty depth, telehealth.'],
  ['S013','Orthodontics',        'Planning', 'High',  '',          'Provider count, clear aligner adoption, financing, location density.'],
  ['S014','Digital Marketing Agencies','Planning','Medium','',     'Recurring retainer revenue, vertical specialization, technical service breadth.'],
  ['S015','Pain Management',     'Planning', 'High',  '',          'Physician capacity, procedure breadth, referral streams, payer access.'],
  ['S016','Physical Therapy',    'Planning', 'High',  '',          'Clinician count, referral relationships, specialty programs, clinic density.'],
  ['S017','Commercial Painting', 'Planning', 'Medium','',          'Commercial project mix, crew capacity, safety credentials, regional coverage.'],
  ['S018','Industrial Coating',  'Planning', 'Medium','',          'Certification depth, industrial client base, equipment intensity.'],
  ['S019','Industrial Safety Consulting','Planning','Medium','',   'Trainer count, recurring compliance audits, course catalog breadth.'],
  ['S020','Dermatology',         'Planning', 'High',  '',          'Provider count, medical/cosmetic mix, Mohs capability, high-margin services.'],
  ['S021','Psychiatric Clinics', 'Planning', 'High',  '',          'Provider count, medication management, telehealth, advanced therapies.'],
  ['S022','Home Health',         'Planning', 'High',  '',          'Caregiver supply, payer mix, referral sources, census capacity.'],
  ['S023','Hospice',             'Planning', 'High',  '',          'Clinical staffing, census capacity, referral density, facility partnerships.'],
  ['S024','Fire & Life Safety',  'Planning', 'High',  '',          'Inspection recurring revenue, technician capacity, code-driven demand.'],
  ['S025','HVAC Services',       'Planning', 'High',  '',          'Maintenance contracts, technician count, residential/commercial mix.'],
  ['S026','Plumbing Services',   'Planning', 'High',  '',          'Emergency demand, technician density, recurring/commercial accounts.'],
  ['S027','Electrical Services', 'Planning', 'High',  '',          'Licensed technician count, commercial exposure, generator/EV adjacency.'],
  ['S028','Restoration Services','Planning', 'High',  '',          'Emergency response, insurance relationships, equipment intensity.'],
  ['S029','Roofing Services',    'Planning', 'High',  '',          'Crew capacity, replacement demand, insurance work, commercial/residential mix.'],
  ['S030','Waste & Recycling',   'Planning', 'High',  '',          'Route density, recurring hauling contracts, facility permits.'],
  ['S031','Pool Services',       'Planning', 'Medium','',          'Recurring cleaning/maintenance, route density, repair/install cross-sell.'],
  ['S032','Property Management / HOA Services','Planning','Medium','','Unit count, HOA contracts, recurring management fees.'],
  ['S033','Tutoring & Test Prep','Planning', 'Medium','',          'Instructor capacity, recurring enrollments, test prep specialization.'],
  ['S034','Sports Tech / League Management','Planning','Low','',   'Recurring SaaS/services, club/league customer base.'],
  ['S035','Dental Practices',    'Planning', 'High',  '',          'Dentist count, hygiene capacity, specialty mix, membership plans.'],
  ['S036','Oral Surgery',        'Planning', 'Medium','',          'Provider count, referral base, anesthesia/surgical capability.'],
  ['S037','Endodontics',         'Planning', 'Medium','',          'Specialist density, referral network, procedure volume proxies.'],
  ['S038','Periodontics',        'Planning', 'Medium','',          'Specialist count, implant/gum surgery mix, referral dependency.'],
  ['S039','Ophthalmology',       'Planning', 'Medium','',          'MD count, surgical service mix, optical/ASC adjacency.'],
  ['S040','ENT Practices',       'Planning', 'Medium','',          'Provider count, procedure breadth, audiology adjacency.'],
  ['S041','Allergy & Asthma Clinics','Planning','Medium','',       'Provider count, recurring immunotherapy, payer access.'],
  ['S042','Gastroenterology',    'Planning', 'Medium','',          'Provider count, ASC/endoscopy center adjacency.'],
  ['S043','Urology',             'Planning', 'Medium','',          'Provider count, procedure breadth, imaging/lab adjacency.'],
  ['S044','Women\'s Health / OB-GYN','Planning','Medium','',       'Provider count, service breadth, payer mix, ancillary services.'],
  ['S045','Fertility Clinics',   'Planning', 'Medium','',          'Physician/embryologist capacity, IVF lab, cycle volume proxies.'],
  ['S046','Ambulatory Surgery Centers','Planning','Medium','',     'OR/procedure room capacity, specialty mix, physician ownership.'],
  ['S047','Imaging Centers',     'Planning', 'Medium','',          'Modality breadth, referral base, equipment intensity, payer access.'],
  ['S048','Urgent Care',         'Planning', 'Medium','',          'Visit volume proxy, provider staffing, hours, payer access.'],
  ['S049','Occupational Medicine','Planning','Medium','',          'Employer contracts, service breadth, recurring screening/testing.'],
  ['S050','ABA Therapy',         'Planning', 'High',  '',          'Clinician/BCBA capacity, center-based model, payer access.'],
  ['S051','Addiction Treatment', 'Planning', 'Medium','',          'Beds/census capacity, levels of care, payer mix, clinical staffing.'],
  ['S052','Senior Living',       'Planning', 'Medium','',          'Unit count, occupancy proxy, care levels, regional portfolio.'],
  ['S053','Memory Care',         'Planning', 'Medium','',          'Specialized bed/unit capacity, staff ratio proxy, programming.'],
  ['S054','RCM / Medical Billing','Planning','Medium','',          'Recurring revenue, specialty focus, client count, offshore delivery.'],
  ['S055','Accounting & Bookkeeping Outsourcing','Planning','Medium','','Recurring client base, vertical focus, staff leverage, tech-enabled.'],
  ['S056','Payroll / HCM Services','Planning','Medium','',         'Recurring payroll revenue, client count, HR add-ons, compliance.'],
  ['S057','Insurance TPA / Claims Services','Planning','Medium','','Claims volume, carrier relationships, specialty lines.'],
  ['S058','Legal Process Outsourcing / IP Services','Planning','Medium','','Services-led delivery, specialist staff, law firm client base.'],
  ['S059','Environmental Consulting','Planning','Medium','',       'Recurring compliance work, professional headcount, permitting.'],
  ['S060','Engineering Services','Planning', 'Medium','',          'Professional headcount, discipline mix, public/private client base.'],
  ['S061','Architecture & Design','Planning','Low',   '',          'Professional headcount, vertical specialization, repeat clients.'],
  ['S062','Testing / Inspection / Certification','Planning','Medium','','Recurring compliance testing, technician/lab capacity.'],
  ['S063','Lab Testing Services','Planning', 'Medium','',          'Sample volume proxy, accreditation, specialty testing breadth.'],
  ['S064','Industrial Automation Integrators','Planning','Low','', 'Engineering headcount, vendor partnerships, project backlog.'],
  ['S065','Facilities Maintenance','Planning','Medium','',         'Recurring contracts, technician network, trade breadth.'],
  ['S066','Commercial Cleaning / Janitorial','Planning','Medium','','Recurring contracts, labor scale, route density.'],
  ['S067','Residential Cleaning','Planning', 'Low',   '',          'Recurring home cleanings, route density, technician labor.'],
  ['S068','Tree Care',           'Planning', 'Medium','',          'Crew/equipment capacity, recurring municipal/commercial accounts.'],
  ['S069','Irrigation Services', 'Planning', 'Low',   '',          'Recurring maintenance, install/repair mix, commercial landscape.'],
  ['S070','Snow & Ice Management','Planning','Low',   '',          'Seasonal recurring contracts, fleet capacity, commercial density.'],
  ['S071','Kitchen & Bath Remodeling','Planning','Low','',         'Project backlog, design-build capability, showroom presence.'],
  ['S072','Basement Waterproofing','Planning','Low',  '',          'Recurring demand from housing stock, crew capacity, financing.'],
  ['S073','Foundation Repair',   'Planning', 'Low',   '',          'Specialized equipment/crew capability, high-ticket projects.'],
  ['S074','Gutter Services',     'Planning', 'Low',   '',          'Install/maintenance mix, route density, exterior services cross-sell.'],
  ['S075','Window & Door Installers','Planning','Low','',          'Replacement demand, dealer/manufacturer relationships.'],
  ['S076','Solar Installation',  'Planning', 'Low',   '',          'Installer capacity, financing model, battery/EV add-ons.'],
  ['S077','Insulation Contractors','Planning','Low',  '',          'Energy-efficiency demand, crew capacity, builder relationships.'],
  ['S078','Septic Services',     'Planning', 'Low',   '',          'Recurring pumping, emergency repair, route density.'],
  ['S079','Water Treatment Services','Planning','Low','',          'Recurring filter/service revenue, install base, equipment partnerships.'],
]

export const SECTORS: Sector[] = RAW_SECTORS.map(
  ([id, name, status, priority, publishDate, notes]) => ({
    id, name, status, priority, publishDate,
    reportLink: '', dataLink: '', tipLink: '', linkedinLink: '', websiteLink: '',
    notes,
    ...SECTOR_LINKS[id],
  })
)

// ─── derive calendar events from sector publish dates ────────────────────────
function sectorToCalendarEvents(s: Sector): CalendarEvent[] {
  if (!s.publishDate) return []
  const p = s.publishDate
  return WORKFLOW_EVENTS.map(ev => ({
    id:     `EVT-${s.id}-${ev.key.toUpperCase()}`,
    date:   addDays(p, ev.sOff),       // use start date for calendar placement
    type:   ev.label,
    sector: s.name,
    notes:  `${ev.label} · ${ev.phase}`,
  }))
}

// ─── assemble ─────────────────────────────────────────────────────────────────
export const SEED_DATA: AppData = {
  sectors:  SECTORS,
  calendar: SECTORS.flatMap(sectorToCalendarEvents),
}
