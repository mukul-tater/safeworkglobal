import electricalImg from '@/assets/trade-electrical.jpg';
import welderImg from '@/assets/trade-welder.jpg';
import plumberImg from '@/assets/trades/plumber.jpg';
import shutteringImg from '@/assets/trades/shuttering.jpg';
import masonImg from '@/assets/trades/mason.jpg';
import labourImg from '@/assets/trades/labour.jpg';
import pipeFitterImg from '@/assets/trades/pipe-fitter.jpg';
import furnitureImg from '@/assets/trades/furniture.jpg';
import acTechnicianImg from '@/assets/trades/ac-technician.jpg';
import warehouseImg from '@/assets/trades/warehouse.jpg';
import scaffolderImg from '@/assets/trades/scaffolder.jpg';
import painterImg from '@/assets/trades/painter.jpg';
import aluminiumImg from '@/assets/trades/aluminium.jpg';
import type { UaeListedJob } from '@/lib/uaeListedJobs';

export const UAE_LISTED_JOB_CARD_VISUALS: Record<UaeListedJob, { image: string; position?: string }> = {
  Electrician: { image: electricalImg, position: 'center 28%' },
  Welder: { image: welderImg, position: 'center 22%' },
  Plumber: { image: plumberImg, position: 'center 40%' },
  'Shuttering Carpenter': { image: shutteringImg, position: 'center 45%' },
  'Mason (tiles/marble)': { image: masonImg, position: 'center 55%' },
  'Construction Labour/Helper': { image: labourImg, position: 'center 30%' },
  'Pipe Fitter': { image: pipeFitterImg, position: 'center 45%' },
  'Furniture Carpenter - Finishing, All Rounder': { image: furnitureImg, position: 'center 55%' },
  'Steel Fixer': { image: '/country-insights/uae/worksite-rebar.png', position: 'center 60%' },
  'AC Technician': { image: acTechnicianImg, position: 'center 30%' },
  'Warehouse Helper': { image: warehouseImg, position: 'center 40%' },
  Scaffolder: { image: scaffolderImg, position: 'center 40%' },
  Painter: { image: painterImg, position: 'center 40%' },
  'Aluminium Fixer/Fabricator': { image: aluminiumImg, position: 'center 40%' },
};

export const UAE_LISTED_JOB_SKILLS: Record<UaeListedJob, string[]> = {
  Electrician: ['Wiring', 'DB / MCB', 'Testing'],
  Welder: ['ARC', 'MIG', 'TIG'],
  Plumber: ['Piping', 'Fixtures', 'Drainage'],
  'Shuttering Carpenter': ['Formwork', 'Alignment', 'Pour'],
  'Mason (tiles/marble)': ['Tiles', 'Marble', 'Stone'],
  'Construction Labour/Helper': ['Site support', 'Materials', 'HSE'],
  'Pipe Fitter': ['Isometrics', 'Flanges', 'Fitting'],
  'Furniture Carpenter - Finishing, All Rounder': ['Joinery', 'Finishing', 'Fit-out'],
  'Steel Fixer': ['Rebar', 'BBS', 'Tying'],
  'AC Technician': ['Split AC', 'Charging', 'Service'],
  'Warehouse Helper': ['Loading', 'Picking', 'Stores'],
  Scaffolder: ['Erect', 'Dismantle', 'Height'],
  Painter: ['Prep', 'Emulsion', 'Spray'],
  'Aluminium Fixer/Fabricator': ['Frames', 'Cladding', 'Fabrication'],
};
