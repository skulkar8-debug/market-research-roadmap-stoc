import type { AppData, Sector, CalendarEvent, SectorStatus } from './types'
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
  S002: { // Veterinary
    reportLink:   'https://www.dropbox.com/scl/fi/g4gbsjozqd4jf1cgvn86j/Veterinary-Services.pdf?rlkey=fidjsfd1frb2wl73bboxc31be&st=9whd6875&dl=0',
    linkedinLink: 'https://www.linkedin.com/posts/stoc-advisory_stoc-advisory-vet-report-2026-activity-7465059584454475777-jKzD/',
    websiteLink:  'https://www.stocadvisory.com/insights/reports/us-veterinary-services-2026',
  },
  S003: { // Commercial Landscaping
    dataLink:     'https://www.dropbox.com/scl/fo/jmi539rd4g5oos2jww7nf/AMOV7IPdQT4TD4SdFrV5SXw?rlkey=pptwn3mye7ynq8bkwwygr5y0c&st=jgum39c5&dl=0',
    reportLink:   'https://www.dropbox.com/scl/fi/drw86m7tmelr6sp6pa5bf/Commercial-Landscaping.pdf?rlkey=8vu591gb0ox0g80adgot2cl5l&st=pcb5ln3b&dl=0',
    linkedinLink: 'https://www.linkedin.com/posts/stoc-advisory_stoc-advisory-us-commercial-landscaping-activity-7475580720023912449-iT7d/',
    websiteLink:  'https://www.stocadvisory.com/insights/reports/us-commercial-landscaping-2026',
  },
  S005: { // Funeral Homes
    dataLink:     'https://www.dropbox.com/scl/fo/n3neyfne2ynqggmjn3b5s/AGSRN1pcNbflYiey4VKcDlo?rlkey=bt66z7oeksufwatnsa5m7v3bs&st=dzk1ney0&dl=0',
  },
  S007: { // Tire & Auto Repair
    dataLink:     'https://www.dropbox.com/scl/fo/ceititkbfyj7h4y04ies0/AE-waF4bAF2FHUXs3Uz1nxI?rlkey=trk4sd5e12wenvkrw2ia4i56k&st=wh3p8qsa&dl=0',
  },
  S008: { // Collision Repair
    dataLink:     'https://www.dropbox.com/scl/fo/3xq159uonadcf4em2rtt8/AHKws6I_2AkZqg5KfUKyx2I?rlkey=2umt5874rh5bgk2vd233t1q8f&st=codjqzqy&dl=0',
  },
}

// ─── raw sector table ─────────────────────────────────────────────────────────
// [id, name, status, publishDate, notes]
type Raw = [string, string, SectorStatus, string, string]

const RAW_SECTORS: Raw[] = [
  ['S001','MedSpa',              'Completed','2026-04-21','Provider/aesthetician capacity, service breadth, memberships, digital maturity.'],
  ['S002','Veterinary',          'Completed','2026-05-26','DVM count, staff count, service breadth, facility capacity, local consolidation.'],
  ['S003','Commercial Landscaping','Published','2026-06-11','Recurring commercial maintenance, route density, crew capacity, snow/ice diversification.'],
  ['S004','Pest Control',        'Published','2026-06-30','Recurring route revenue, technician density, termite/wildlife specialization.'],
  ['S005','Funeral Homes',       'Research Done','',          'Cremation capability, pre-need revenue, family-owned fragmentation.'],
  ['S006','Youth Sports',        'Planning','',          'Facility utilization, recurring registrations, tournaments, club networks.'],
  ['S007','Tire & Auto Repair',  'Research Done','',          'Bay count, technician count, tire sales mix, fleet/commercial accounts.'],
  ['S008','Collision Repair',    'Research Done','',          'Insurance relationships, OEM certifications, paint booth capacity.'],
  ['S009','Managed Service Provider (MSP)','Planning','',   'Recurring managed services, cybersecurity depth, technical headcount.'],
  ['S010','Security Services',   'Planning','',          'Guard force scale, recurring contracts, patrol/monitoring mix.'],
  ['S011','Garage Door Repair',  'Planning','',          'Technician density, emergency service, installation/repair mix.'],
  ['S012','Behavioral Health',   'Planning','',          'Clinician capacity, payer mix, specialty depth, telehealth.'],
  ['S013','Orthodontics',        'Planning','',          'Provider count, clear aligner adoption, financing, location density.'],
  ['S014','Digital Marketing Agencies','Planning','',     'Recurring retainer revenue, vertical specialization, technical service breadth.'],
  ['S015','Pain Management',     'Planning','',          'Physician capacity, procedure breadth, referral streams, payer access.'],
  ['S016','Physical Therapy',    'Planning','',          'Clinician count, referral relationships, specialty programs, clinic density.'],
  ['S017','Commercial Painting', 'Planning','',          'Commercial project mix, crew capacity, safety credentials, regional coverage.'],
  ['S018','Industrial Coating',  'Planning','',          'Certification depth, industrial client base, equipment intensity.'],
  ['S019','Industrial Safety Consulting','Planning','',   'Trainer count, recurring compliance audits, course catalog breadth.'],
  ['S020','Dermatology',         'Planning','',          'Provider count, medical/cosmetic mix, Mohs capability, high-margin services.'],
  ['S021','Psychiatric Clinics', 'Planning','',          'Provider count, medication management, telehealth, advanced therapies.'],
  ['S022','Home Health',         'Planning','',          'Caregiver supply, payer mix, referral sources, census capacity.'],
  ['S023','Hospice',             'Planning','',          'Clinical staffing, census capacity, referral density, facility partnerships.'],
  ['S024','Fire & Life Safety',  'Planning','',          'Inspection recurring revenue, technician capacity, code-driven demand.'],
  ['S025','HVAC Services',       'Planning','',          'Maintenance contracts, technician count, residential/commercial mix.'],
  ['S026','Plumbing Services',   'Planning','',          'Emergency demand, technician density, recurring/commercial accounts.'],
  ['S027','Electrical Services', 'Planning','',          'Licensed technician count, commercial exposure, generator/EV adjacency.'],
  ['S028','Restoration Services','Planning','',          'Emergency response, insurance relationships, equipment intensity.'],
  ['S029','Roofing Services',    'Planning','',          'Crew capacity, replacement demand, insurance work, commercial/residential mix.'],
  ['S030','Waste & Recycling',   'Planning','',          'Route density, recurring hauling contracts, facility permits.'],
  ['S031','Pool Services',       'Planning','',          'Recurring cleaning/maintenance, route density, repair/install cross-sell.'],
  ['S032','Property Management / HOA Services','Planning','','Unit count, HOA contracts, recurring management fees.'],
  ['S033','Tutoring & Test Prep','Planning','',          'Instructor capacity, recurring enrollments, test prep specialization.'],
  ['S034','Sports Tech / League Management','Planning','',   'Recurring SaaS/services, club/league customer base.'],
  ['S035','Dental Practices',    'Planning','',          'Dentist count, hygiene capacity, specialty mix, membership plans.'],
  ['S036','Oral Surgery',        'Planning','',          'Provider count, referral base, anesthesia/surgical capability.'],
  ['S037','Endodontics',         'Planning','',          'Specialist density, referral network, procedure volume proxies.'],
  ['S038','Periodontics',        'Planning','',          'Specialist count, implant/gum surgery mix, referral dependency.'],
  ['S039','Ophthalmology',       'Planning','',          'MD count, surgical service mix, optical/ASC adjacency.'],
  ['S040','ENT Practices',       'Planning','',          'Provider count, procedure breadth, audiology adjacency.'],
  ['S041','Allergy & Asthma Clinics','Planning','',       'Provider count, recurring immunotherapy, payer access.'],
  ['S042','Gastroenterology',    'Planning','',          'Provider count, ASC/endoscopy center adjacency.'],
  ['S043','Urology',             'Planning','',          'Provider count, procedure breadth, imaging/lab adjacency.'],
  ['S044','Women\'s Health / OB-GYN','Planning','',       'Provider count, service breadth, payer mix, ancillary services.'],
  ['S045','Fertility Clinics',   'Planning','',          'Physician/embryologist capacity, IVF lab, cycle volume proxies.'],
  ['S046','Ambulatory Surgery Centers','Planning','',     'OR/procedure room capacity, specialty mix, physician ownership.'],
  ['S047','Imaging Centers',     'Planning','',          'Modality breadth, referral base, equipment intensity, payer access.'],
  ['S048','Urgent Care',         'Planning','',          'Visit volume proxy, provider staffing, hours, payer access.'],
  ['S049','Occupational Medicine','Planning','',          'Employer contracts, service breadth, recurring screening/testing.'],
  ['S050','ABA Therapy',         'Planning','',          'Clinician/BCBA capacity, center-based model, payer access.'],
  ['S051','Addiction Treatment', 'Planning','',          'Beds/census capacity, levels of care, payer mix, clinical staffing.'],
  ['S052','Senior Living',       'Planning','',          'Unit count, occupancy proxy, care levels, regional portfolio.'],
  ['S053','Memory Care',         'Planning','',          'Specialized bed/unit capacity, staff ratio proxy, programming.'],
  ['S054','RCM / Medical Billing','Planning','',          'Recurring revenue, specialty focus, client count, offshore delivery.'],
  ['S055','Accounting & Bookkeeping Outsourcing','Planning','','Recurring client base, vertical focus, staff leverage, tech-enabled.'],
  ['S056','Payroll / HCM Services','Planning','',         'Recurring payroll revenue, client count, HR add-ons, compliance.'],
  ['S057','Insurance TPA / Claims Services','Planning','','Claims volume, carrier relationships, specialty lines.'],
  ['S058','Legal Process Outsourcing / IP Services','Planning','','Services-led delivery, specialist staff, law firm client base.'],
  ['S059','Environmental Consulting','Planning','',       'Recurring compliance work, professional headcount, permitting.'],
  ['S060','Engineering Services','Planning','',          'Professional headcount, discipline mix, public/private client base.'],
  ['S061','Architecture & Design','Planning','',          'Professional headcount, vertical specialization, repeat clients.'],
  ['S062','Testing / Inspection / Certification','Planning','','Recurring compliance testing, technician/lab capacity.'],
  ['S063','Lab Testing Services','Planning','',          'Sample volume proxy, accreditation, specialty testing breadth.'],
  ['S064','Industrial Automation Integrators','Planning','', 'Engineering headcount, vendor partnerships, project backlog.'],
  ['S065','Facilities Maintenance','Planning','',         'Recurring contracts, technician network, trade breadth.'],
  ['S066','Commercial Cleaning / Janitorial','Planning','','Recurring contracts, labor scale, route density.'],
  ['S067','Residential Cleaning','Planning','',          'Recurring home cleanings, route density, technician labor.'],
  ['S068','Tree Care',           'Planning','',          'Crew/equipment capacity, recurring municipal/commercial accounts.'],
  ['S069','Irrigation Services', 'Planning','',          'Recurring maintenance, install/repair mix, commercial landscape.'],
  ['S070','Snow & Ice Management','Planning','',          'Seasonal recurring contracts, fleet capacity, commercial density.'],
  ['S071','Kitchen & Bath Remodeling','Planning','',         'Project backlog, design-build capability, showroom presence.'],
  ['S072','Basement Waterproofing','Planning','',          'Recurring demand from housing stock, crew capacity, financing.'],
  ['S073','Foundation Repair',   'Planning','',          'Specialized equipment/crew capability, high-ticket projects.'],
  ['S074','Gutter Services',     'Planning','',          'Install/maintenance mix, route density, exterior services cross-sell.'],
  ['S075','Window & Door Installers','Planning','',          'Replacement demand, dealer/manufacturer relationships.'],
  ['S076','Solar Installation',  'Planning','',          'Installer capacity, financing model, battery/EV add-ons.'],
  ['S077','Insulation Contractors','Planning','',          'Energy-efficiency demand, crew capacity, builder relationships.'],
  ['S078','Septic Services',     'Planning','',          'Recurring pumping, emergency repair, route density.'],
  ['S079','Water Treatment Services','Planning','',          'Recurring filter/service revenue, install base, equipment partnerships.'],
]

export const SECTORS: Sector[] = RAW_SECTORS.map(
  ([id, name, status, publishDate, notes]) => ({
    id, name, status, publishDate,
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
