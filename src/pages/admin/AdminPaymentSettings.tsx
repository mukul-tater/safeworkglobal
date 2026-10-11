import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { adminNavGroups, adminProfileMenu } from '@/config/adminNav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  getPlatformPaymentSettings,
  loadPlatformPaymentSettings,
  paymentSettingsFromDatabase,
  savePlatformPaymentSettings,
  type PlatformPaymentSettings,
} from '@/lib/platformPaymentSettings';

type FxDraft = { code: string; rate: string };

function money(settings: PlatformPaymentSettings) {
  return {
    defaultCharge: String(settings.defaultServiceChargeInr),
    uae: String(settings.uaeServiceChargeInr),
    delivery: String(settings.uaeDeliveryServiceChargeInr),
    ukraine: String(settings.ukraineServiceChargeInr),
    europe: String(settings.europeServiceChargeInr),
    gst: String(settings.gstRatePct),
    gateway: String(settings.razorpayGatewayFeePct),
    beneficiary: settings.bankBeneficiary,
    account: settings.bankAccountNumber,
    bank: settings.bankName,
    ifsc: settings.bankIfsc,
    inclusions: settings.feeInclusions.join('\n'),
    stamp: String(settings.indemnityBondStampInr),
    fx: Object.entries(settings.fxRates).map(([code, rate]) => ({
      code,
      rate: String(rate),
    })),
  };
}

function parseAmount(label: string, raw: string): number {
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 1 || n > 500000) {
    throw new Error(`${label} must be a whole rupee amount from 1 to 5,00,000`);
  }
  return n;
}

export default function AdminPaymentSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [stored, setStored] = useState(true);
  const [defaultCharge, setDefaultCharge] = useState('35400');
  const [uae, setUae] = useState('35400');
  const [delivery, setDelivery] = useState('94400');
  const [ukraine, setUkraine] = useState('236000');
  const [europe, setEurope] = useState('354000');
  const [gst, setGst] = useState('18');
  const [gateway, setGateway] = useState('2.5');
  const [beneficiary, setBeneficiary] = useState('');
  const [account, setAccount] = useState('');
  const [bank, setBank] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [inclusions, setInclusions] = useState('');
  const [stamp, setStamp] = useState('100');
  const [fx, setFx] = useState<FxDraft[]>([
    { code: 'AED', rate: '23' },
    { code: 'CZK', rate: String(665 / 150) },
  ]);

  const fill = (settings: PlatformPaymentSettings) => {
    const draft = money(settings);
    setDefaultCharge(draft.defaultCharge);
    setUae(draft.uae);
    setDelivery(draft.delivery);
    setUkraine(draft.ukraine);
    setEurope(draft.europe);
    setGst(draft.gst);
    setGateway(draft.gateway);
    setBeneficiary(draft.beneficiary);
    setAccount(draft.account);
    setBank(draft.bank);
    setIfsc(draft.ifsc);
    setInclusions(draft.inclusions);
    setStamp(draft.stamp);
    setFx(draft.fx);
    setStored(paymentSettingsFromDatabase());
  };

  useEffect(() => {
    let cancelled = false;
    void loadPlatformPaymentSettings()
      .then((settings) => {
        if (!cancelled) fill(settings);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const save = async () => {
    try {
      const gstRate = Number(gst);
      const gatewayRate = Number(gateway);
      const stampInr = Number(stamp);
      if (!Number.isFinite(gstRate) || gstRate < 0 || gstRate > 40) {
        throw new Error('GST percent must be between 0 and 40');
      }
      if (!Number.isFinite(gatewayRate) || gatewayRate < 0 || gatewayRate > 15) {
        throw new Error('Razorpay extra percent must be between 0 and 15');
      }
      if (!Number.isInteger(stampInr) || stampInr < 1 || stampInr > 100000) {
        throw new Error('Stamp amount must be a whole number of rupees');
      }
      const feeLines = inclusions.split('\n').map((line) => line.trim()).filter(Boolean);
      if (feeLines.length < 1 || feeLines.length > 20) {
        throw new Error('Enter between 1 and 20 lines for what the fee covers');
      }
      const fxRates = fx.map((row) => {
        const code = row.code.trim().toUpperCase();
        const inrPerUnit = Number(row.rate);
        if (!/^[A-Z]{3}$/.test(code)) throw new Error('Each currency code must be 3 letters');
        if (!Number.isFinite(inrPerUnit) || inrPerUnit <= 0) {
          throw new Error(`Enter a rate greater than 0 for ${code}`);
        }
        return { code, inrPerUnit };
      });
      setSaving(true);
      await savePlatformPaymentSettings({
        defaultServiceChargeInr: parseAmount('Default service charge', defaultCharge),
        uaeServiceChargeInr: parseAmount('UAE service charge', uae),
        uaeDeliveryServiceChargeInr: parseAmount('Delivery service charge', delivery),
        ukraineServiceChargeInr: parseAmount('Ukraine service charge', ukraine),
        europeServiceChargeInr: parseAmount('Europe service charge', europe),
        gstRatePct: gstRate,
        razorpayGatewayFeePct: gatewayRate,
        bankBeneficiary: beneficiary.trim(),
        bankAccountNumber: account.replace(/\s/g, ''),
        bankName: bank.trim(),
        bankIfsc: ifsc.trim().toUpperCase(),
        feeInclusions: feeLines,
        indemnityBondStampInr: stampInr,
        fxRates,
      });
      fill(getPlatformPaymentSettings());
      toast.success('Payment settings saved');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not save payment settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout
      navGroups={adminNavGroups}
      portalLabel="Admin Panel"
      portalName="Admin Panel"
      profileMenuItems={adminProfileMenu}
    >
      <div className="max-w-3xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold mb-2">Fees & payments</h1>
          <p className="text-sm text-muted-foreground">
            These amounts are what workers pay. Every job shows that amount with “+ GST” written next to it. GST is not calculated.
            Saving also updates the service charge on current UAE, Ukraine, and Europe listings.
            Razorpay API keys stay in the edge function settings.
          </p>
        </div>

        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <>
            {!stored && (
              <p className="text-sm text-amber-800">
                Showing the built-in amounts. Saving needs the payment settings migration applied on the database.
              </p>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Service charges (₹)</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <Field label="Default for other jobs" value={defaultCharge} onChange={setDefaultCharge} />
                <Field label="UAE trades" value={uae} onChange={setUae} />
                <Field label="UAE bike delivery" value={delivery} onChange={setDelivery} />
                <Field label="Ukraine listings" value={ukraine} onChange={setUkraine} />
                <Field label="Europe listings" value={europe} onChange={setEurope} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">GST and Razorpay</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="GST %" value={gst} onChange={setGst} step="0.01" />
                  <Field label="Razorpay extra %" value={gateway} onChange={setGateway} step="0.01" />
                </div>
                <p className="text-xs text-muted-foreground">
                  GST % is not added to the service charge. Jobs show the entered amount with “+ GST”. Razorpay extra % is still added only on Razorpay checkout.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">What the fee covers</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Label>One item per line</Label>
                <Textarea value={inclusions} onChange={(e) => setInclusions(e.target.value)} rows={8} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Bank transfer account</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <Field label="Beneficiary" value={beneficiary} onChange={setBeneficiary} text />
                <Field label="Bank" value={bank} onChange={setBank} text />
                <Field label="Account number" value={account} onChange={setAccount} text />
                <Field label="IFSC" value={ifsc} onChange={setIfsc} text />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Indemnity bond stamp</CardTitle>
              </CardHeader>
              <CardContent>
                <Field label="Stamp paper (₹)" value={stamp} onChange={setStamp} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Exchange rates (rupees per 1 unit)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {fx.map((row, index) => (
                  <div key={`${row.code}-${index}`} className="flex flex-wrap items-end gap-2">
                    <div className="space-y-1.5">
                      <Label>Currency</Label>
                      <Input
                        value={row.code}
                        maxLength={3}
                        className="w-24 uppercase"
                        onChange={(e) => {
                          const next = [...fx];
                          next[index] = { ...row, code: e.target.value.toUpperCase() };
                          setFx(next);
                        }}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>₹ per 1</Label>
                      <Input
                        type="number"
                        min={0}
                        step="0.00000001"
                        value={row.rate}
                        className="w-40"
                        onChange={(e) => {
                          const next = [...fx];
                          next[index] = { ...row, rate: e.target.value };
                          setFx(next);
                        }}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setFx(fx.filter((_, i) => i !== index))}
                      disabled={fx.length === 1}
                      aria-label="Remove currency"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setFx([...fx, { code: '', rate: '' }])}
                >
                  <Plus className="h-4 w-4 mr-1" /> Add currency
                </Button>
              </CardContent>
            </Card>

            <Button onClick={() => void save()} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              Save payment settings
            </Button>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

function Field({
  label,
  value,
  onChange,
  text,
  step,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  text?: boolean;
  step?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input
        type={text ? 'text' : 'number'}
        min={text ? undefined : 0}
        step={text ? undefined : step || '1'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
