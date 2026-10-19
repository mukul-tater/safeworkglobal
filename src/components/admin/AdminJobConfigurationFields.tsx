import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { JOB_CATEGORIES } from '@/lib/constants';
import { QUIZ_SKILL_CODES } from '@/modules/worker-verification/quiz-data/quizSkill';

export type JobConfigValues = {
  title_hi: string;
  processing_time: string;
  processing_time_hi: string;
  category: string;
  city: string;
  work_phrase: string;
  benefits_hi: string;
  quiz_skill_code: string;
  quiz_pass_score: string;
  card_image_url: string;
  salary_display: string;
  slug: string;
  seo_title: string;
  seo_description: string;
  indexable: boolean;
  hidden_from_public: boolean;
  use_saved_copy: boolean;
};

export const EMPTY_JOB_CONFIG: JobConfigValues = {
  title_hi: '',
  processing_time: '',
  processing_time_hi: '',
  category: '',
  city: '',
  work_phrase: '',
  benefits_hi: '',
  quiz_skill_code: '',
  quiz_pass_score: '',
  card_image_url: '',
  salary_display: '',
  slug: '',
  seo_title: '',
  seo_description: '',
  indexable: true,
  hidden_from_public: false,
  use_saved_copy: false,
};

function blank(value: string | null | undefined): string | null {
  const text = (value || '').trim();
  return text || null;
}

export function configValues(data: Partial<JobConfigValues> | null | undefined): JobConfigValues {
  const source = data || {};
  return {
    title_hi: source.title_hi || '',
    processing_time: source.processing_time || '',
    processing_time_hi: source.processing_time_hi || '',
    category: source.category || '',
    city: source.city || '',
    work_phrase: source.work_phrase || '',
    benefits_hi: source.benefits_hi || '',
    quiz_skill_code: source.quiz_skill_code || '',
    quiz_pass_score: source.quiz_pass_score || '',
    card_image_url: source.card_image_url || '',
    salary_display: source.salary_display || '',
    slug: source.slug || '',
    seo_title: source.seo_title || '',
    seo_description: source.seo_description || '',
    indexable: source.indexable !== false,
    hidden_from_public: Boolean(source.hidden_from_public),
    use_saved_copy: Boolean(source.use_saved_copy),
  };
}

/** Columns written with the rest of the admin job patch. A typed pay sentence wins over the generated one. */
export function jobConfigPatch(values: JobConfigValues, generatedPaySentence?: string | null) {
  const fields = jobConfigSaveFields(values);
  return {
    ...fields,
    salary_display: fields.salary_display || generatedPaySentence || null,
  };
}

/** Columns written with the rest of the admin job patch. */
export function jobConfigSaveFields(values: JobConfigValues) {
  return {
    title_hi: blank(values.title_hi),
    processing_time: blank(values.processing_time),
    processing_time_hi: blank(values.processing_time_hi),
    category: blank(values.category),
    city: blank(values.city),
    work_phrase: blank(values.work_phrase),
    benefits_hi: blank(values.benefits_hi),
    quiz_skill_code: blank(values.quiz_skill_code),
    quiz_pass_score: blank(values.quiz_pass_score),
    card_image_url: blank(values.card_image_url),
    salary_display: blank(values.salary_display),
    slug: blank(values.slug),
    seo_title: blank(values.seo_title),
    seo_description: blank(values.seo_description),
    indexable: values.indexable !== false,
    hidden_from_public: Boolean(values.hidden_from_public),
    use_saved_copy: Boolean(values.use_saved_copy),
  };
}

const CATEGORIES = JOB_CATEGORIES.filter((category) => category !== 'All Categories');
const AUTO = '__auto__';

interface Props {
  values: JobConfigValues;
  onChange: (patch: Partial<JobConfigValues>) => void;
  cardImageError?: string;
  slugError?: string;
}

export default function AdminJobConfigurationFields({ values, onChange, cardImageError, slugError }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Listing configuration</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start gap-2">
          <Checkbox
            id="use_saved_copy"
            checked={values.use_saved_copy}
            onCheckedChange={(checked) => onChange({ use_saved_copy: checked === true })}
          />
          <div>
            <Label htmlFor="use_saved_copy" className="cursor-pointer">
              Show the saved job text on Find jobs
            </Label>
            <p className="text-xs text-muted-foreground mt-1">
              Title, description, duties, benefits and pay on this form are what workers see. Leave this off to keep the standard trade page for a UAE listing.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="title_hi">Hindi job name</Label>
            <Input
              id="title_hi"
              value={values.title_hi}
              onChange={(event) => onChange({ title_hi: event.target.value })}
              placeholder="इलेक्ट्रीशियन"
            />
          </div>
          <div>
            <Label htmlFor="category">Category</Label>
            <Select
              value={values.category || AUTO}
              onValueChange={(value) => onChange({ category: value === AUTO ? '' : value })}
            >
              <SelectTrigger id="category">
                <SelectValue placeholder="Automatic from the title" />
              </SelectTrigger>
              <SelectContent className="max-h-64">
                <SelectItem value={AUTO}>Automatic from the title</SelectItem>
                {CATEGORIES.map((category) => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="processing_time">Processing time</Label>
            <Input
              id="processing_time"
              value={values.processing_time}
              onChange={(event) => onChange({ processing_time: event.target.value })}
              placeholder="4–6 weeks"
            />
          </div>
          <div>
            <Label htmlFor="processing_time_hi">Processing time (Hindi)</Label>
            <Input
              id="processing_time_hi"
              value={values.processing_time_hi}
              onChange={(event) => onChange({ processing_time_hi: event.target.value })}
              placeholder="4–6 सप्ताह"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              value={values.city}
              onChange={(event) => onChange({ city: event.target.value })}
              placeholder="Dubai"
            />
          </div>
          <div>
            <Label htmlFor="work_phrase">Skill-proof phrase</Label>
            <Input
              id="work_phrase"
              value={values.work_phrase}
              onChange={(event) => onChange({ work_phrase: event.target.value })}
              placeholder="welding"
            />
            <p className="text-xs text-muted-foreground mt-1">Shown as “doing welding” in the journey.</p>
          </div>
        </div>

        <div>
          <Label htmlFor="salary_display">Pay sentence</Label>
          <Textarea
            id="salary_display"
            value={values.salary_display}
            onChange={(event) => onChange({ salary_display: event.target.value })}
            rows={2}
            placeholder="AED 1,200 – 1,500 (₹35,000 – ₹42,000) per month"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Leave blank to build this from the salary ranges. A sentence here is what workers read.
          </p>
        </div>

        <div>
          <Label htmlFor="benefits_hi">Benefits in Hindi</Label>
          <Textarea
            id="benefits_hi"
            value={values.benefits_hi}
            onChange={(event) => onChange({ benefits_hi: event.target.value })}
            rows={4}
            placeholder={'One Hindi line per English benefit\nफ्लाइट टिकट'}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="quiz_skill_code">Test 1 paper</Label>
            <Select
              value={values.quiz_skill_code || AUTO}
              onValueChange={(value) => onChange({ quiz_skill_code: value === AUTO ? '' : value })}
            >
              <SelectTrigger id="quiz_skill_code">
                <SelectValue placeholder="Automatic from the title" />
              </SelectTrigger>
              <SelectContent className="max-h-64">
                <SelectItem value={AUTO}>Automatic from the title</SelectItem>
                {QUIZ_SKILL_CODES.map((code) => (
                  <SelectItem key={code} value={code}>{code}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="quiz_pass_score">Test 1 pass score</Label>
            <Input
              id="quiz_pass_score"
              inputMode="numeric"
              value={values.quiz_pass_score}
              onChange={(event) => onChange({ quiz_pass_score: event.target.value.replace(/[^\d]/g, '').slice(0, 3) })}
              placeholder="60, or 70 for Delivery"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Leave blank to use the paper default. 1–100 is the percent a worker must reach.
            </p>
          </div>
          <div>
            <Label htmlFor="card_image_url">Card image URL</Label>
            <Input
              id="card_image_url"
              value={values.card_image_url}
              onChange={(event) => onChange({ card_image_url: event.target.value })}
              placeholder="https://"
              aria-invalid={!!cardImageError}
            />
            {cardImageError && <p className="text-sm text-destructive mt-1">{cardImageError}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="slug">Public slug</Label>
            <Input
              id="slug"
              value={values.slug}
              onChange={(event) => onChange({ slug: event.target.value })}
              placeholder="uae-electrician"
            />
            {slugError && <p className="text-sm text-destructive mt-1">{slugError}</p>}
          </div>
          <div>
            <Label htmlFor="seo_title">SEO title</Label>
            <Input
              id="seo_title"
              value={values.seo_title}
              onChange={(event) => onChange({ seo_title: event.target.value })}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="seo_description">SEO description</Label>
          <Textarea
            id="seo_description"
            value={values.seo_description}
            onChange={(event) => onChange({ seo_description: event.target.value })}
            rows={2}
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Checkbox
              id="indexable"
              checked={values.indexable}
              onCheckedChange={(checked) => onChange({ indexable: checked === true })}
            />
            <Label htmlFor="indexable" className="cursor-pointer">Allow search engines to index this job</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="hidden_from_public"
              checked={values.hidden_from_public}
              onCheckedChange={(checked) => onChange({ hidden_from_public: checked === true })}
            />
            <Label htmlFor="hidden_from_public" className="cursor-pointer">Hide from Find jobs</Label>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
