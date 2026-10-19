import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { adminNavGroups, adminProfileMenu } from '@/config/adminNav';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { BenefitCatalogItem } from '@/lib/jobBenefits';
import { UAE_LISTED_JOBS } from '@/lib/uaeListedJobs';
import '@/lib/jobTemplates';
import {
  applyCopyFields,
  defaultSiteContent,
  getSiteContent,
  listCopyFields,
  loadSiteContent,
  saveSiteSection,
  type CopyField,
  type CountryCardConfig,
  type IndemnityContent,
  type SiteContent,
  type SiteSection,
  type StoredJobTemplate,
} from '@/lib/siteContent';

function linesText(lines: string[]) {
  return lines.join('\n');
}

function readLines(text: string) {
  return text.replace(/\r/g, '').split('\n').map((line) => line.trim()).filter(Boolean);
}

function cleanBenefitItems(items: BenefitCatalogItem[]): BenefitCatalogItem[] {
  return items
    .map((item) => ({
      en: item.en.trim(),
      hi: item.hi?.trim() || undefined,
      info: item.info?.trim() || undefined,
      infoHi: item.infoHi?.trim() || undefined,
    }))
    .filter((item) => item.en);
}

function BenefitListEditor({
  title,
  hint,
  items,
  onChange,
}: {
  title: string;
  hint: string;
  items: BenefitCatalogItem[];
  onChange: (items: BenefitCatalogItem[]) => void;
}) {
  const update = (index: number, patch: Partial<BenefitCatalogItem>) => {
    onChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{hint}</p>
        {items.map((item, index) => (
          <div key={`${title}-${index}`} className="space-y-2 rounded-lg border p-3">
            <div className="flex items-center justify-between gap-2">
              <Label>Benefit {index + 1}</Label>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Remove benefit ${index + 1}`}
                onClick={() => onChange(items.filter((_, i) => i !== index))}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <Input value={item.en} placeholder="English" onChange={(event) => update(index, { en: event.target.value })} />
            <Input value={item.hi || ''} placeholder="Hindi" onChange={(event) => update(index, { hi: event.target.value })} />
            <Input value={item.info || ''} placeholder="Short note" onChange={(event) => update(index, { info: event.target.value })} />
            <Input
              value={item.infoHi || ''}
              placeholder="Hindi note"
              onChange={(event) => update(index, { infoHi: event.target.value })}
            />
          </div>
        ))}
        <Button type="button" variant="outline" onClick={() => onChange([...items, { en: '' }])}>
          <Plus className="mr-2 h-4 w-4" /> Add benefit
        </Button>
      </CardContent>
    </Card>
  );
}

function placesText(places: CountryCardConfig['places']) {
  return places.map((place) => (place.hindi ? `${place.name} | hi` : place.name)).join('\n');
}

function readPlaces(text: string): CountryCardConfig['places'] {
  return text
    .replace(/\r/g, '')
    .split('\n')
    .map((line) => {
      const hindi = /\|\s*hi\s*$/i.test(line);
      const name = line.replace(/\|\s*hi\s*$/i, '').trim();
      return name ? { name, hindi } : null;
    })
    .filter((place): place is { name: string; hindi: boolean } => !!place);
}

export default function AdminSiteContent() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<SiteSection | null>(null);
  const [content, setContent] = useState<SiteContent>(() => defaultSiteContent());
  const [copyFields, setCopyFields] = useState<CopyField[]>([]);
  const [placeDrafts, setPlaceDrafts] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    void loadSiteContent()
      .then((loaded) => {
        if (cancelled) return;
        setContent(structuredClone(loaded));
        setCopyFields(listCopyFields(loaded.preJourney));
        setPlaceDrafts(Object.fromEntries(loaded.countryCards.map((card) => [card.key, placesText(card.places)])));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const persist = async (section: SiteSection, value: unknown, label: string) => {
    setSaving(section);
    try {
      await saveSiteSection(section, value);
      const fresh = structuredClone(getSiteContent());
      setContent(fresh);
      setCopyFields(listCopyFields(fresh.preJourney));
      setPlaceDrafts(Object.fromEntries(fresh.countryCards.map((card) => [card.key, placesText(card.places)])));
      toast.success(`${label} saved`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not save');
    } finally {
      setSaving(null);
    }
  };

  const updateCard = (key: CountryCardConfig['key'], patch: Partial<CountryCardConfig>) => {
    setContent((current) => ({
      ...current,
      countryCards: current.countryCards.map((card) => (card.key === key ? { ...card, ...patch } : card)),
    }));
  };

  const updateTemplate = (index: number, patch: Partial<StoredJobTemplate>) => {
    setContent((current) => ({
      ...current,
      jobTemplates: current.jobTemplates.map((template, i) => (i === index ? { ...template, ...patch } : template)),
    }));
  };

  const updateIndemnity = (patch: Partial<IndemnityContent>) => {
    setContent((current) => ({ ...current, indemnity: { ...current.indemnity, ...patch } }));
  };

  return (
    <DashboardLayout
      navGroups={adminNavGroups}
      portalLabel="Admin Panel"
      portalName="Admin Panel"
      profileMenuItems={adminProfileMenu}
    >
      <div className="max-w-4xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold mb-2">Site content</h1>
          <p className="text-sm text-muted-foreground">
            Country cards, trade photos, job titles, the benefits lists, screening text, and the indemnity bond. A blank field keeps the built-in sentence. Saving here updates what workers see next.
          </p>
        </div>
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <Tabs defaultValue="countries">
            <TabsList className="flex h-auto flex-wrap justify-start">
              <TabsTrigger value="countries">Countries</TabsTrigger>
              <TabsTrigger value="trades">Trade photos</TabsTrigger>
              <TabsTrigger value="titles">Titles</TabsTrigger>
              <TabsTrigger value="templates">Quick post</TabsTrigger>
              <TabsTrigger value="benefits">Benefits</TabsTrigger>
              <TabsTrigger value="screening">Screening</TabsTrigger>
              <TabsTrigger value="acks">Declarations</TabsTrigger>
              <TabsTrigger value="bond">Indemnity bond</TabsTrigger>
            </TabsList>

            <TabsContent value="countries" className="space-y-4">
              {content.countryCards.map((card) => (
                <Card key={card.key}>
                  <CardHeader>
                    <CardTitle>{card.key}</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <Label>Hindi name</Label>
                      <Input value={card.titleHi} onChange={(event) => updateCard(card.key, { titleHi: event.target.value })} />
                    </div>
                    <div>
                      <Label>English name</Label>
                      <Input value={card.titleEn} onChange={(event) => updateCard(card.key, { titleEn: event.target.value })} />
                    </div>
                    <div className="sm:col-span-2">
                      <Label>Image URL or path</Label>
                      <Input value={card.image} onChange={(event) => updateCard(card.key, { image: event.target.value })} />
                    </div>
                    <div>
                      <Label>Image position</Label>
                      <Input value={card.position} onChange={(event) => updateCard(card.key, { position: event.target.value })} />
                    </div>
                    <div className="sm:col-span-2">
                      <Label>Places, one per line. Add | hi for a Hindi name.</Label>
                      <Textarea
                        rows={5}
                        value={placeDrafts[card.key] ?? ''}
                        onChange={(event) => setPlaceDrafts((current) => ({ ...current, [card.key]: event.target.value }))}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
              <div className="flex gap-2">
                <Button
                  type="button"
                  disabled={saving === 'country_cards'}
                  onClick={() => {
                    const cards = content.countryCards.map((card) => ({
                      ...card,
                      places: readPlaces(placeDrafts[card.key] ?? placesText(card.places)),
                    }));
                    void persist('country_cards', cards, 'Country cards');
                  }}
                >
                  {saving === 'country_cards' ? 'Saving…' : 'Save country cards'}
                </Button>
                <Button type="button" variant="outline" onClick={() => void persist('country_cards', null, 'Country cards')}>
                  Use built-in cards
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="trades" className="space-y-4">
              <Card>
                <CardContent className="grid gap-3 pt-6">
                  {UAE_LISTED_JOBS.map((job) => (
                    <div key={job}>
                      <Label>{job}</Label>
                      <Input
                        value={content.tradeCardImages[job] || ''}
                        placeholder="Built-in photo"
                        onChange={(event) =>
                          setContent((current) => ({
                            ...current,
                            tradeCardImages: { ...current.tradeCardImages, [job]: event.target.value },
                          }))
                        }
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>
              <div className="flex gap-2">
                <Button
                  type="button"
                  disabled={saving === 'trade_card_images'}
                  onClick={() => {
                    const images = Object.fromEntries(
                      Object.entries(content.tradeCardImages).filter(([, url]) => url.trim()),
                    );
                    void persist('trade_card_images', images, 'Trade photos');
                  }}
                >
                  {saving === 'trade_card_images' ? 'Saving…' : 'Save trade photos'}
                </Button>
                <Button type="button" variant="outline" onClick={() => void persist('trade_card_images', null, 'Trade photos')}>
                  Use built-in photos
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="titles" className="space-y-4">
              <Card>
                <CardContent className="pt-6">
                  <Label>Popular job titles, one per line</Label>
                  <Textarea
                    rows={12}
                    value={linesText(content.popularTitles)}
                    onChange={(event) =>
                      setContent((current) => ({ ...current, popularTitles: event.target.value.replace(/\r/g, '').split('\n') }))
                    }
                  />
                </CardContent>
              </Card>
              <div className="flex gap-2">
                <Button
                  type="button"
                  disabled={saving === 'popular_titles'}
                  onClick={() => void persist('popular_titles', readLines(linesText(content.popularTitles)), 'Job titles')}
                >
                  {saving === 'popular_titles' ? 'Saving…' : 'Save titles'}
                </Button>
                <Button type="button" variant="outline" onClick={() => void persist('popular_titles', null, 'Job titles')}>
                  Use built-in titles
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="templates" className="space-y-4">
              {content.jobTemplates.map((template, index) => (
                <Card key={`${template.key}-${index}`}>
                  <CardHeader className="flex-row items-center justify-between space-y-0">
                    <CardTitle>{template.role || 'New template'}</CardTitle>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        setContent((current) => ({
                          ...current,
                          jobTemplates: current.jobTemplates.filter((_, i) => i !== index),
                        }))
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardHeader>
                  <CardContent className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <Label>Role</Label>
                      <Input value={template.role} onChange={(event) => updateTemplate(index, { role: event.target.value })} />
                    </div>
                    <div>
                      <Label>Match words, comma separated</Label>
                      <Input
                        value={template.keywords.join(', ')}
                        onChange={(event) =>
                          updateTemplate(index, {
                            keywords: event.target.value.split(',').map((word) => word.trim().toLowerCase()).filter(Boolean),
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label>Category</Label>
                      <Input value={template.category} onChange={(event) => updateTemplate(index, { category: event.target.value })} />
                    </div>
                    <div>
                      <Label>Experience</Label>
                      <Input
                        value={template.experienceLevel}
                        onChange={(event) =>
                          updateTemplate(index, {
                            experienceLevel: event.target.value as StoredJobTemplate['experienceLevel'],
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label>Salary min (INR)</Label>
                      <Input
                        inputMode="numeric"
                        value={String(template.salaryMin)}
                        onChange={(event) => updateTemplate(index, { salaryMin: Number(event.target.value) || 0 })}
                      />
                    </div>
                    <div>
                      <Label>Salary max (INR)</Label>
                      <Input
                        inputMode="numeric"
                        value={String(template.salaryMax)}
                        onChange={(event) => updateTemplate(index, { salaryMax: Number(event.target.value) || 0 })}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <Label>Description</Label>
                      <Textarea
                        rows={3}
                        value={template.description}
                        onChange={(event) => updateTemplate(index, { description: event.target.value })}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    setContent((current) => ({
                      ...current,
                      jobTemplates: [
                        ...current.jobTemplates,
                        {
                          key: `template-${current.jobTemplates.length + 1}`,
                          role: '',
                          category: 'Construction',
                          description: '',
                          responsibilities: [],
                          requirements: [],
                          skills: [],
                          keywords: [],
                          salaryMin: 0,
                          salaryMax: 0,
                          experienceLevel: 'INTERMEDIATE',
                          minYearsExperience: 0,
                        },
                      ],
                    }))
                  }
                >
                  <Plus className="mr-1.5 h-4 w-4" />
                  Add template
                </Button>
                <Button
                  type="button"
                  disabled={saving === 'job_templates'}
                  onClick={() => {
                    const templates = content.jobTemplates
                      .map((template) => ({
                        ...template,
                        role: template.role.trim(),
                        key: (template.key || template.role).trim().toLowerCase().replace(/\s+/g, '-'),
                        keywords: template.keywords.map((word) => word.trim().toLowerCase()).filter(Boolean),
                      }))
                      .filter((template) => template.role);
                    if (!templates.length) {
                      toast.error('Add at least one template, or use the built-in set');
                      return;
                    }
                    void persist('job_templates', templates, 'Quick-post templates');
                  }}
                >
                  {saving === 'job_templates' ? 'Saving…' : 'Save templates'}
                </Button>
                <Button type="button" variant="outline" onClick={() => void persist('job_templates', null, 'Quick-post templates')}>
                  Use built-in templates
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="screening" className="space-y-4">
              {copyFields.map((field, index) => (
                <Card key={field.path || index}>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">{field.path}</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-3 sm:grid-cols-2">
                    <Textarea
                      rows={3}
                      value={field.en}
                      onChange={(event) =>
                        setCopyFields((current) =>
                          current.map((item, i) => (i === index ? { ...item, en: event.target.value } : item)),
                        )
                      }
                    />
                    <Textarea
                      rows={3}
                      value={field.hi}
                      onChange={(event) =>
                        setCopyFields((current) =>
                          current.map((item, i) => (i === index ? { ...item, hi: event.target.value } : item)),
                        )
                      }
                    />
                  </CardContent>
                </Card>
              ))}
              <div className="flex gap-2">
                <Button
                  type="button"
                  disabled={saving === 'pre_journey'}
                  onClick={() =>
                    void persist('pre_journey', applyCopyFields(defaultSiteContent().preJourney, copyFields), 'Screening text')
                  }
                >
                  {saving === 'pre_journey' ? 'Saving…' : 'Save screening text'}
                </Button>
                <Button type="button" variant="outline" onClick={() => void persist('pre_journey', null, 'Screening text')}>
                  Use built-in screening text
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="acks" className="space-y-4">
              {content.acknowledgements.map((item, index) => (
                <Card key={item.key}>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">{item.key}</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-3 sm:grid-cols-2">
                    <Textarea
                      rows={3}
                      value={item.text}
                      onChange={(event) =>
                        setContent((current) => ({
                          ...current,
                          acknowledgements: current.acknowledgements.map((ack, i) =>
                            i === index ? { ...ack, text: event.target.value } : ack,
                          ),
                        }))
                      }
                    />
                    <Textarea
                      rows={3}
                      value={item.textHi}
                      onChange={(event) =>
                        setContent((current) => ({
                          ...current,
                          acknowledgements: current.acknowledgements.map((ack, i) =>
                            i === index ? { ...ack, textHi: event.target.value } : ack,
                          ),
                        }))
                      }
                    />
                  </CardContent>
                </Card>
              ))}
              <div className="flex gap-2">
                <Button
                  type="button"
                  disabled={saving === 'acknowledgements'}
                  onClick={() => void persist('acknowledgements', content.acknowledgements, 'Declarations')}
                >
                  {saving === 'acknowledgements' ? 'Saving…' : 'Save declarations'}
                </Button>
                <Button type="button" variant="outline" onClick={() => void persist('acknowledgements', null, 'Declarations')}>
                  Use built-in declarations
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="bond" className="space-y-4">
              <Card>
                <CardContent className="grid gap-3 pt-6 sm:grid-cols-2">
                  <div>
                    <Label>Version</Label>
                    <Input value={content.indemnity.version} onChange={(event) => updateIndemnity({ version: event.target.value })} />
                  </div>
                  <div>
                    <Label>Title (English)</Label>
                    <Input
                      value={content.indemnity.title.en}
                      onChange={(event) => updateIndemnity({ title: { ...content.indemnity.title, en: event.target.value } })}
                    />
                  </div>
                  <div>
                    <Label>Title (Hindi)</Label>
                    <Input
                      value={content.indemnity.title.hi}
                      onChange={(event) => updateIndemnity({ title: { ...content.indemnity.title, hi: event.target.value } })}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label>Subtitle (English / Hindi)</Label>
                    <Input
                      value={content.indemnity.subtitle.en}
                      onChange={(event) => updateIndemnity({ subtitle: { ...content.indemnity.subtitle, en: event.target.value } })}
                    />
                    <Input
                      className="mt-2"
                      value={content.indemnity.subtitle.hi}
                      onChange={(event) => updateIndemnity({ subtitle: { ...content.indemnity.subtitle, hi: event.target.value } })}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label>Preamble (English)</Label>
                    <Textarea
                      rows={4}
                      value={content.indemnity.preamble.en}
                      onChange={(event) => updateIndemnity({ preamble: { ...content.indemnity.preamble, en: event.target.value } })}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label>Preamble (Hindi)</Label>
                    <Textarea
                      rows={4}
                      value={content.indemnity.preamble.hi}
                      onChange={(event) => updateIndemnity({ preamble: { ...content.indemnity.preamble, hi: event.target.value } })}
                    />
                  </div>
                  <div>
                    <Label>Highlights (English, one per line)</Label>
                    <Textarea
                      rows={5}
                      value={linesText(content.indemnity.highlights.en)}
                      onChange={(event) =>
                        updateIndemnity({
                          highlights: { ...content.indemnity.highlights, en: event.target.value.replace(/\r/g, '').split('\n') },
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label>Highlights (Hindi, one per line)</Label>
                    <Textarea
                      rows={5}
                      value={linesText(content.indemnity.highlights.hi)}
                      onChange={(event) =>
                        updateIndemnity({
                          highlights: { ...content.indemnity.highlights, hi: event.target.value.replace(/\r/g, '').split('\n') },
                        })
                      }
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label>How to complete the bond (English)</Label>
                    <Input
                      value={content.indemnity.execution.title.en}
                      onChange={(event) =>
                        updateIndemnity({
                          execution: { ...content.indemnity.execution, title: { ...content.indemnity.execution.title, en: event.target.value } },
                        })
                      }
                    />
                    <Textarea
                      className="mt-2"
                      rows={3}
                      value={content.indemnity.execution.body.en}
                      onChange={(event) =>
                        updateIndemnity({
                          execution: { ...content.indemnity.execution, body: { ...content.indemnity.execution.body, en: event.target.value } },
                        })
                      }
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label>How to complete the bond (Hindi)</Label>
                    <Input
                      value={content.indemnity.execution.title.hi}
                      onChange={(event) =>
                        updateIndemnity({
                          execution: { ...content.indemnity.execution, title: { ...content.indemnity.execution.title, hi: event.target.value } },
                        })
                      }
                    />
                    <Textarea
                      className="mt-2"
                      rows={3}
                      value={content.indemnity.execution.body.hi}
                      onChange={(event) =>
                        updateIndemnity({
                          execution: { ...content.indemnity.execution, body: { ...content.indemnity.execution.body, hi: event.target.value } },
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label>Bond steps (English, one per line)</Label>
                    <Textarea
                      rows={4}
                      value={linesText(content.indemnity.execution.bullets.en)}
                      onChange={(event) =>
                        updateIndemnity({
                          execution: {
                            ...content.indemnity.execution,
                            bullets: { ...content.indemnity.execution.bullets, en: event.target.value.replace(/\r/g, '').split('\n') },
                          },
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label>Bond steps (Hindi, one per line)</Label>
                    <Textarea
                      rows={4}
                      value={linesText(content.indemnity.execution.bullets.hi)}
                      onChange={(event) =>
                        updateIndemnity({
                          execution: {
                            ...content.indemnity.execution,
                            bullets: { ...content.indemnity.execution.bullets, hi: event.target.value.replace(/\r/g, '').split('\n') },
                          },
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label>Signature lines (English)</Label>
                    <Textarea
                      rows={4}
                      value={linesText(content.indemnity.signatures.en)}
                      onChange={(event) =>
                        updateIndemnity({
                          signatures: { ...content.indemnity.signatures, en: event.target.value.replace(/\r/g, '').split('\n') },
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label>Signature lines (Hindi)</Label>
                    <Textarea
                      rows={4}
                      value={linesText(content.indemnity.signatures.hi)}
                      onChange={(event) =>
                        updateIndemnity({
                          signatures: { ...content.indemnity.signatures, hi: event.target.value.replace(/\r/g, '').split('\n') },
                        })
                      }
                    />
                  </div>
                </CardContent>
              </Card>
              {content.indemnity.clauses.map((clause, index) => (
                <Card key={`${clause.no}-${index}`}>
                  <CardHeader className="flex-row items-center justify-between space-y-0">
                    <CardTitle className="text-sm">Clause {clause.no}</CardTitle>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        updateIndemnity({
                          clauses: content.indemnity.clauses.filter((_, i) => i !== index),
                        })
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardHeader>
                  <CardContent className="grid gap-3">
                    <Textarea
                      rows={3}
                      value={clause.en}
                      onChange={(event) =>
                        updateIndemnity({
                          clauses: content.indemnity.clauses.map((item, i) =>
                            i === index ? { ...item, en: event.target.value } : item,
                          ),
                        })
                      }
                    />
                    <Textarea
                      rows={3}
                      value={clause.hi}
                      onChange={(event) =>
                        updateIndemnity({
                          clauses: content.indemnity.clauses.map((item, i) =>
                            i === index ? { ...item, hi: event.target.value } : item,
                          ),
                        })
                      }
                    />
                  </CardContent>
                </Card>
              ))}
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    updateIndemnity({
                      clauses: [
                        ...content.indemnity.clauses,
                        { no: String(content.indemnity.clauses.length + 1), en: '', hi: '' },
                      ],
                    })
                  }
                >
                  <Plus className="mr-1.5 h-4 w-4" />
                  Add clause
                </Button>
                <Button
                  type="button"
                  disabled={saving === 'indemnity_bond'}
                  onClick={() => {
                    const bond = {
                      ...content.indemnity,
                      highlights: {
                        en: readLines(linesText(content.indemnity.highlights.en)),
                        hi: readLines(linesText(content.indemnity.highlights.hi)),
                      },
                      execution: {
                        ...content.indemnity.execution,
                        bullets: {
                          en: readLines(linesText(content.indemnity.execution.bullets.en)),
                          hi: readLines(linesText(content.indemnity.execution.bullets.hi)),
                        },
                      },
                      signatures: {
                        en: readLines(linesText(content.indemnity.signatures.en)),
                        hi: readLines(linesText(content.indemnity.signatures.hi)),
                      },
                      clauses: content.indemnity.clauses
                        .map((clause, index) => ({ ...clause, no: String(clause.no || index + 1).trim() }))
                        .filter((clause) => clause.en.trim() || clause.hi.trim()),
                    };
                    void persist('indemnity_bond', bond, 'Indemnity bond');
                  }}
                >
                  {saving === 'indemnity_bond' ? 'Saving…' : 'Save indemnity bond'}
                </Button>
                <Button type="button" variant="outline" onClick={() => void persist('indemnity_bond', null, 'Indemnity bond')}>
                  Use built-in bond
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="benefits" className="space-y-4">
              <BenefitListEditor
                title="Standard benefits"
                hint="Checkboxes on a new job, and the list workers see when a job has no benefits of its own."
                items={content.benefitCatalog.standard}
                onChange={(standard) =>
                  setContent((current) => ({
                    ...current,
                    benefitCatalog: { ...current.benefitCatalog, standard },
                  }))
                }
              />
              <BenefitListEditor
                title="Bike delivery benefits"
                hint="Used for bike delivery jobs. Hindi is shown under each English line."
                items={content.benefitCatalog.delivery}
                onChange={(delivery) =>
                  setContent((current) => ({
                    ...current,
                    benefitCatalog: { ...current.benefitCatalog, delivery },
                  }))
                }
              />
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  onClick={() =>
                    void persist(
                      'benefit_catalog',
                      {
                        standard: cleanBenefitItems(content.benefitCatalog.standard),
                        delivery: cleanBenefitItems(content.benefitCatalog.delivery),
                      },
                      'Benefits',
                    )
                  }
                >
                  {saving === 'benefit_catalog' ? 'Saving…' : 'Save benefits'}
                </Button>
                <Button type="button" variant="outline" onClick={() => void persist('benefit_catalog', null, 'Benefits')}>
                  Use built-in lists
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </DashboardLayout>
  );
}
