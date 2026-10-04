import electricalImg from '@/assets/trade-electrical.jpg';
import welderImg from '@/assets/trade-welder.jpg';
import migWelderImg from '@/assets/trades/mig-welder.jpg';
import tigWelderImg from '@/assets/trades/tig-welder.jpg';
import plumberImg from '@/assets/trades/plumber.jpg';
import shutteringImg from '@/assets/trades/shuttering.jpg';
import masonImg from '@/assets/trades/mason.jpg';
import masonBrickPlasterImg from '@/assets/trades/mason-brick-plaster.jpg';
import labourImg from '@/assets/trades/labour.jpg';
import pipeFitterImg from '@/assets/trades/pipe-fitter.jpg';
import furnitureImg from '@/assets/trades/furniture.jpg';
import acTechnicianImg from '@/assets/trades/ac-technician.jpg';
import warehouseImg from '@/assets/trades/warehouse.jpg';
import scaffolderImg from '@/assets/trades/scaffolder.jpg';
import painterImg from '@/assets/trades/painter.jpg';
import aluminiumImg from '@/assets/trades/aluminium.jpg';
import cleanerMaleImg from '@/assets/trades/cleaner-male.jpg';
import cleanerFemaleImg from '@/assets/trades/cleaner-female.jpg';
import type { UaeListedJob } from '@/lib/uaeListedJobs';

export const UAE_LISTED_JOB_CARD_VISUALS: Record<UaeListedJob, { image: string; position?: string }> = {
  Electrician: { image: electricalImg, position: 'center 28%' },
  Welder: { image: welderImg, position: 'center 22%' },
  'MIG Welder': { image: migWelderImg, position: 'center 45%' },
  'TIG Welder': { image: tigWelderImg, position: 'center 38%' },
  Plumber: { image: plumberImg, position: 'center 42%' },
  'Shuttering Carpenter': { image: shutteringImg, position: 'center 45%' },
  'Mason (tiles/marble)': { image: masonImg, position: 'center 38%' },
  'Mason (bricks/plaster)': { image: masonBrickPlasterImg, position: 'center 32%' },
  'Construction Labour/Helper': { image: labourImg, position: 'center 30%' },
  'Pipe Fitter': { image: pipeFitterImg, position: 'center 40%' },
  'Furniture Carpenter - Finishing, All Rounder': { image: furnitureImg, position: 'center 55%' },
  'Steel Fixer': { image: '/country-insights/uae/worksite-rebar.png', position: 'center 60%' },
  'AC Technician': { image: acTechnicianImg, position: 'center 30%' },
  'Warehouse Helper': { image: warehouseImg, position: 'center 40%' },
  'Cleaner (Male)': { image: cleanerMaleImg, position: 'center 18%' },
  'Cleaner (Female)': { image: cleanerFemaleImg, position: 'center 42%' },
  Scaffolder: { image: scaffolderImg, position: 'center 40%' },
  Painter: { image: painterImg, position: 'center 40%' },
  'Aluminium Fixer/Fabricator': { image: aluminiumImg, position: 'center 32%' },
};

export const UAE_LISTED_JOB_SKILLS: Record<UaeListedJob, string[]> = {
  Electrician: ['Wiring', 'DB / MCB', 'Testing'],
  Welder: ['ARC', 'MIG', 'TIG'],
  'MIG Welder': ['MIG', 'Steel', 'Fabrication'],
  'TIG Welder': ['TIG', 'Pipe', 'Stainless'],
  Plumber: ['Piping', 'Fixtures', 'Drainage'],
  'Shuttering Carpenter': ['Formwork', 'Alignment', 'Pour'],
  'Mason (tiles/marble)': ['Tiles', 'Marble', 'Stone'],
  'Mason (bricks/plaster)': ['Bricks', 'Block', 'Plaster'],
  'Construction Labour/Helper': ['Site support', 'Materials', 'HSE'],
  'Pipe Fitter': ['Isometrics', 'Flanges', 'Fitting'],
  'Furniture Carpenter - Finishing, All Rounder': ['Joinery', 'Finishing', 'Fit-out'],
  'Steel Fixer': ['Rebar', 'BBS', 'Tying'],
  'AC Technician': ['Split AC', 'Charging', 'Service'],
  'Warehouse Helper': ['Loading', 'Picking', 'Stores'],
  'Cleaner (Male)': ['Cleaning', 'Housekeeping', 'HSE'],
  'Cleaner (Female)': ['Cleaning', 'Housekeeping', 'HSE'],
  Scaffolder: ['Erect', 'Dismantle', 'Height'],
  Painter: ['Prep', 'Emulsion', 'Spray'],
  'Aluminium Fixer/Fabricator': ['Frames', 'Cladding', 'Fabrication'],
};
