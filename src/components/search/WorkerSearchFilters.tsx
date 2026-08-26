import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Search, Save, X, MapPin, DollarSign, Briefcase, Award, ShieldCheck, Languages, Settings2 } from 'lucide-react';
import {
  NATIONALITIES,
  AVAILABILITY_OPTIONS,
  POPULAR_SKILLS,
  PRIMARY_WORK_TYPES,
  WORKER_LANGUAGES,
  VERIFIABLE_DOC_TYPES,
  ECR_STATUS_OPTIONS,
  SKILL_LEVELS,
  SHIFT_PREFERENCES,
} from '@/lib/constants';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Switch } from '@/components/ui/switch';

export interface WorkerFilters {
  keyword: string;
  nationality: string;
  currentLocation: string;
  skills: string[];
  experienceYears: number[];
  salaryMin: number;
  salaryMax: number;
  hasPassport: boolean;
  hasVisa: boolean;
  availability: string;
  // New trust & verification filters
  hasVideo: boolean;
  verifiedDocs: string[]; // doc_type keys, e.g. ['passport','visa']
  hasCertifications: boolean;
  certificationKeyword: string;
  ecrStatus: string; // 'all' | 'ecr' | 'ecnr' | 'not_checked'
  // Skills & experience
  primaryWorkType: string; // 'All' or a specific role
  skillLevel: string; // 'All' or one of SKILL_LEVELS
  // Preferences
  languages: string[];
  openToRelocation: boolean;
  preferredShift: string; // 'All' | 'Day' | 'Night' | 'Flexible'
}

interface WorkerSearchFiltersProps {
  filters: WorkerFilters;
  onFiltersChange: (filters: WorkerFilters) => void;
  onSearch: () => void;
  onSaveSearch: () => void;
  loading?: boolean;
}

export default function WorkerSearchFilters({
  filters,
  onFiltersChange,
  onSearch,
  onSaveSearch,
  loading = false
}: WorkerSearchFiltersProps) {
  const [skillInput, setSkillInput] = useState('');

  const handleAddSkill = (skill: string) => {
    if (skill && !filters.skills.includes(skill)) {
      onFiltersChange({
        ...filters,
        skills: [...filters.skills, skill]
      });
    }
    setSkillInput('');
  };

  const handleRemoveSkill = (skill: string) => {
    onFiltersChange({
      ...filters,
      skills: filters.skills.filter(s => s !== skill)
    });
  };

  return (
    <Card className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Advanced Filters</h2>
        <Button variant="ghost" size="sm" onClick={onSaveSearch}>
          <Save className="h-4 w-4 mr-2" />
          Save Search
        </Button>
      </div>

      {/* Keyword Search */}
      <div className="space-y-2">
        <Label htmlFor="keyword">
          <Search className="h-4 w-4 inline mr-2" />
          Search by Name or Skills
        </Label>
        <Input
          id="keyword"
          placeholder="e.g., Welder, Electrician"
          value={filters.keyword}
          onChange={(e) => onFiltersChange({ ...filters, keyword: e.target.value })}
        />
      </div>

      {/* Nationality & Location */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="nationality">Nationality</Label>
          <Select
            value={filters.nationality}
            onValueChange={(value) => onFiltersChange({ ...filters, nationality: value })}
          >
            <SelectTrigger id="nationality">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-card z-50 max-h-64">
              {NATIONALITIES.map(nat => (
                <SelectItem key={nat} value={nat}>{nat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="location">
            <MapPin className="h-4 w-4 inline mr-2" />
            Current Location
          </Label>
          <Input
            id="location"
            placeholder="e.g., Delhi, Manila"
            value={filters.currentLocation}
            onChange={(e) => onFiltersChange({ ...filters, currentLocation: e.target.value })}
          />
        </div>
      </div>

      {/* Experience Range */}
      <div className="space-y-4">
        <Label>
          <Award className="h-4 w-4 inline mr-2" />
          Years of Experience
        </Label>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span>{filters.experienceYears[0]} years</span>
            <span>{filters.experienceYears[1]}+ years</span>
          </div>
          <Slider
            min={0}
            max={30}
            step={1}
            value={filters.experienceYears}
            onValueChange={(value) => 
              onFiltersChange({ ...filters, experienceYears: value as [number, number] })
            }
            className="w-full"
          />
        </div>
      </div>

      {/* Expected Salary Range */}
      <div className="space-y-4">
        <Label>
          <DollarSign className="h-4 w-4 inline mr-2" />
          Expected Salary Range (USD/month)
        </Label>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span>${filters.salaryMin.toLocaleString()}</span>
            <span>${filters.salaryMax.toLocaleString()}</span>
          </div>
          <Slider
            min={0}
            max={10000}
            step={500}
            value={[filters.salaryMin, filters.salaryMax]}
            onValueChange={([min, max]) => 
              onFiltersChange({ ...filters, salaryMin: min, salaryMax: max })
            }
            className="w-full"
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              type="number"
              placeholder="Min"
              value={filters.salaryMin}
              onChange={(e) => onFiltersChange({ 
                ...filters, 
                salaryMin: parseInt(e.target.value) || 0 
              })}
            />
            <Input
              type="number"
              placeholder="Max"
              value={filters.salaryMax}
              onChange={(e) => onFiltersChange({ 
                ...filters, 
                salaryMax: parseInt(e.target.value) || 10000 
              })}
            />
          </div>
        </div>
      </div>

      {/* Availability */}
      <div className="space-y-2">
        <Label htmlFor="availability">Availability</Label>
        <Select
          value={filters.availability}
          onValueChange={(value) => onFiltersChange({ ...filters, availability: value })}
        >
          <SelectTrigger id="availability">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-card z-50">
            {AVAILABILITY_OPTIONS.map(option => (
              <SelectItem key={option} value={option}>{option}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Document Status */}
      <div className="space-y-3">
        <Label>Document Status</Label>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="passport"
              checked={filters.hasPassport}
              onCheckedChange={(checked) => 
                onFiltersChange({ ...filters, hasPassport: checked as boolean })
              }
            />
            <Label htmlFor="passport" className="cursor-pointer">
              Has Valid Passport
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="visa"
              checked={filters.hasVisa}
              onCheckedChange={(checked) => 
                onFiltersChange({ ...filters, hasVisa: checked as boolean })
              }
            />
            <Label htmlFor="visa" className="cursor-pointer">
              Has Work Visa
            </Label>
          </div>
        </div>
      </div>

      {/* Skills */}
      <div className="space-y-2">
        <Label>
          <Briefcase className="h-4 w-4 inline mr-2" />
          Required Skills
        </Label>
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              placeholder="Add skill (e.g., Welding)"
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddSkill(skillInput);
                }
              }}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => handleAddSkill(skillInput)}
            >
              Add
            </Button>
          </div>
          
          {/* Selected Skills */}
          {filters.skills.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {filters.skills.map(skill => (
                <Badge key={skill} variant="secondary" className="gap-1">
                  {skill}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => handleRemoveSkill(skill)}
                  />
                </Badge>
              ))}
            </div>
          )}

          {/* Popular Skills Quick Add */}
          <div>
            <p className="text-xs text-muted-foreground mb-2">Popular Skills:</p>
            <div className="flex flex-wrap gap-2">
              {POPULAR_SKILLS.filter(s => !filters.skills.includes(s)).map(skill => (
                <Badge
                  key={skill}
                  variant="outline"
                  className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                  onClick={() => handleAddSkill(skill)}
                >
                  + {skill}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Filter Sections */}
      <Accordion type="multiple" defaultValue={['trust']} className="w-full">
        {/* Trust & Verification */}
        <AccordionItem value="trust">
          <AccordionTrigger>
            <span className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-success" />
              Trust & Verification
            </span>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="hasVideo" className="cursor-pointer text-sm">
                Video proof available
              </Label>
              <Switch
                id="hasVideo"
                checked={filters.hasVideo}
                onCheckedChange={(checked) => onFiltersChange({ ...filters, hasVideo: checked })}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Verified documents</Label>
              <div className="grid grid-cols-2 gap-2">
                {VERIFIABLE_DOC_TYPES.map((doc) => {
                  const checked = filters.verifiedDocs.includes(doc.key);
                  return (
                    <div key={doc.key} className="flex items-center space-x-2">
                      <Checkbox
                        id={`doc-${doc.key}`}
                        checked={checked}
                        onCheckedChange={(c) => {
                          const next = c
                            ? [...filters.verifiedDocs, doc.key]
                            : filters.verifiedDocs.filter((d) => d !== doc.key);
                          onFiltersChange({ ...filters, verifiedDocs: next });
                        }}
                      />
                      <Label htmlFor={`doc-${doc.key}`} className="cursor-pointer text-xs">
                        {doc.label}
                      </Label>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="hasCerts" className="cursor-pointer text-sm">
                  Has certifications
                </Label>
                <Switch
                  id="hasCerts"
                  checked={filters.hasCertifications}
                  onCheckedChange={(checked) =>
                    onFiltersChange({ ...filters, hasCertifications: checked })
                  }
                />
              </div>
              <Input
                placeholder="Filter cert. by name"
                value={filters.certificationKeyword}
                onChange={(e) =>
                  onFiltersChange({ ...filters, certificationKeyword: e.target.value })
                }
                className="text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm">ECR status</Label>
              <Select
                value={filters.ecrStatus}
                onValueChange={(v) => onFiltersChange({ ...filters, ecrStatus: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card z-50">
                  {ECR_STATUS_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Skills & Experience */}
        <AccordionItem value="skills-exp">
          <AccordionTrigger>
            <span className="flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-primary" />
              Skills & Experience
            </span>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label className="text-sm">Primary work type</Label>
              <Select
                value={filters.primaryWorkType}
                onValueChange={(v) => onFiltersChange({ ...filters, primaryWorkType: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card z-50 max-h-64">
                  <SelectItem value="All">All work types</SelectItem>
                  {PRIMARY_WORK_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Skill level</Label>
              <Select
                value={filters.skillLevel}
                onValueChange={(v) => onFiltersChange({ ...filters, skillLevel: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card z-50">
                  <SelectItem value="All">All levels</SelectItem>
                  {SKILL_LEVELS.map((l) => (
                    <SelectItem key={l} value={l}>
                      {l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Preferences */}
        <AccordionItem value="prefs">
          <AccordionTrigger>
            <span className="flex items-center gap-2">
              <Settings2 className="h-4 w-4 text-primary" />
              Preferences
            </span>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label className="text-sm">
                <Languages className="h-4 w-4 inline mr-1" />
                Languages spoken
              </Label>
              <div className="grid grid-cols-2 gap-2 max-h-44 overflow-y-auto pr-1">
                {WORKER_LANGUAGES.map((lang) => {
                  const checked = filters.languages.includes(lang);
                  return (
                    <div key={lang} className="flex items-center space-x-2">
                      <Checkbox
                        id={`lang-${lang}`}
                        checked={checked}
                        onCheckedChange={(c) => {
                          const next = c
                            ? [...filters.languages, lang]
                            : filters.languages.filter((l) => l !== lang);
                          onFiltersChange({ ...filters, languages: next });
                        }}
                      />
                      <Label htmlFor={`lang-${lang}`} className="cursor-pointer text-xs">
                        {lang}
                      </Label>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="relocation" className="cursor-pointer text-sm">
                Open to relocation
              </Label>
              <Switch
                id="relocation"
                checked={filters.openToRelocation}
                onCheckedChange={(checked) =>
                  onFiltersChange({ ...filters, openToRelocation: checked })
                }
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Preferred shift</Label>
              <Select
                value={filters.preferredShift}
                onValueChange={(v) => onFiltersChange({ ...filters, preferredShift: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card z-50">
                  <SelectItem value="All">Any shift</SelectItem>
                  {SHIFT_PREFERENCES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4">
        <Button
          onClick={onSearch}
          disabled={loading}
          className="flex-1"
        >
          <Search className="h-4 w-4 mr-2" />
          {loading ? 'Searching...' : 'Search Workers'}
        </Button>
        <Button
          variant="outline"
          onClick={() => onFiltersChange({
            keyword: '',
            nationality: 'All Nationalities',
            currentLocation: '',
            skills: [],
            experienceYears: [0, 30],
            salaryMin: 0,
            salaryMax: 10000,
            hasPassport: false,
            hasVisa: false,
            availability: 'All',
            hasVideo: false,
            verifiedDocs: [],
            hasCertifications: false,
            certificationKeyword: '',
            ecrStatus: 'all',
            primaryWorkType: 'All',
            skillLevel: 'All',
            languages: [],
            openToRelocation: false,
            preferredShift: 'All',
          })}
        >
          Clear All
        </Button>
      </div>
    </Card>
  );
}
