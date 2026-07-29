import WorkerPortalLayout from "@/components/layout/WorkerPortalLayout";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { DollarSign, Clock, CheckCircle, TrendingUp, ArrowDownCircle, Shield, Calendar, Receipt, ArrowRight, ExternalLink } from "lucide-react";
import { format } from "date-fns";

interface Payment {
  id: string;
  gross_amount: number | null;
  platform_fee: number | null;
  platform_fee_percentage: number | null;
  net_amount: number | null;
  amount: number;
  currency: string;
  escrow_status: string | null;
  status: string;
  payment_type: string;
  description: string | null;
  created_at: string | null;
  released_at: string | null;
  paid_at: string | null;
  job_id: string | null;
  transaction_id: string | null;
  payment_method: string | null;
}

export default function WorkerPayments() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("all");
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

  const { data: payments = [], isLoading } = useQuery({
    queryKey: ["worker-payments", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("payments")
        .select("*")
        .eq("worker_id", user.id)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as Payment[];
    },
    enabled: !!user?.id,
  });

  const getStatusBadge = (escrowStatus: string | null, status: string) => {
    const displayStatus = escrowStatus || status;
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      PENDING: { variant: "secondary", label: "Pending" },
      HELD: { variant: "outline", label: "In Escrow" },
      RELEASED: { variant: "default", label: "Released" },
      REFUNDED: { variant: "destructive", label: "Refunded" },
      completed: { variant: "default", label: "Completed" },
      pending: { variant: "secondary", label: "Pending" },
    };
    const config = variants[displayStatus] || { variant: "secondary", label: displayStatus };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getStatusTimeline = (payment: Payment) => {
    const steps = [
      {
        label: "Payment Created",
        date: payment.created_at,
        completed: true,
      },
      {
        label: "Held in Escrow",
        date: payment.created_at,
        completed: payment.escrow_status === "HELD" || payment.escrow_status === "RELEASED" || payment.escrow_status === "REFUNDED",
      },
      {
        label: payment.escrow_status === "REFUNDED" ? "Refunded" : "Released to You",
        date: payment.released_at,
        completed: payment.escrow_status === "RELEASED" || payment.escrow_status === "REFUNDED",
      },
    ];
    return steps;
  };

  const filteredPayments = payments.filter((payment) => {
    if (activeTab === "all") return true;
    if (activeTab === "pending") return payment.escrow_status === "PENDING" || payment.escrow_status === "HELD";
    if (activeTab === "released") return payment.escrow_status === "RELEASED";
    if (activeTab === "refunded") return payment.escrow_status === "REFUNDED";
    return true;
  });

  // Calculate statistics
  const totalReceived = payments
    .filter((p) => p.escrow_status === "RELEASED")
    .reduce((sum, p) => sum + (p.net_amount || p.amount), 0);

  const pendingAmount = payments
    .filter((p) => p.escrow_status === "HELD" || p.escrow_status === "PENDING")
    .reduce((sum, p) => sum + (p.net_amount || p.amount), 0);

  const totalFeesPaid = payments
    .filter((p) => p.escrow_status === "RELEASED")
    .reduce((sum, p) => sum + (p.platform_fee || 0), 0);

  const totalPayments = payments.filter((p) => p.escrow_status === "RELEASED").length;

  return (
    <WorkerPortalLayout>
            <div className="max-w-7xl mx-auto space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-foreground">My Payments</h1>
                <p className="text-muted-foreground mt-1">
                  View your payment history and escrow details
                </p>
              </div>

              {/* Statistics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Received</CardTitle>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      ${totalReceived.toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      From {totalPayments} payments
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pending Release</CardTitle>
                    <Clock className="h-4 w-4 text-yellow-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-yellow-600">
                      ${pendingAmount.toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      In escrow
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Platform Fees</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      ${totalFeesPaid.toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      1% service fee
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
                    <DollarSign className="h-4 w-4 text-primary" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{payments.length}</div>
                    <p className="text-xs text-muted-foreground">
                      All time
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* How It Works */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    How Escrow Protects You
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="flex items-start gap-3">
                      <div className="rounded-full bg-primary/10 p-2">
                        <span className="text-primary font-bold">1</span>
                      </div>
                      <div>
                        <p className="font-medium">Employer Funds</p>
                        <p className="text-sm text-muted-foreground">Employer deposits payment into escrow</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="rounded-full bg-primary/10 p-2">
                        <span className="text-primary font-bold">2</span>
                      </div>
                      <div>
                        <p className="font-medium">Work Completed</p>
                        <p className="text-sm text-muted-foreground">You complete your assigned work</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="rounded-full bg-primary/10 p-2">
                        <span className="text-primary font-bold">3</span>
                      </div>
                      <div>
                        <p className="font-medium">Release Approved</p>
                        <p className="text-sm text-muted-foreground">Employer approves the release</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="rounded-full bg-primary/10 p-2">
                        <span className="text-primary font-bold">4</span>
                      </div>
                      <div>
                        <p className="font-medium">You Get Paid</p>
                        <p className="text-sm text-muted-foreground">Funds released to you (1% fee)</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payment History */}
              <Card>
                <CardHeader>
                  <CardTitle>Payment History</CardTitle>
                  <CardDescription>
                    Your escrow payments and fee breakdown
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="mb-4">
                      <TabsTrigger value="all">All</TabsTrigger>
                      <TabsTrigger value="pending">Pending</TabsTrigger>
                      <TabsTrigger value="released">Released</TabsTrigger>
                      <TabsTrigger value="refunded">Refunded</TabsTrigger>
                    </TabsList>

                    <TabsContent value={activeTab}>
                      {isLoading ? (
                        <div className="flex justify-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                      ) : filteredPayments.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <ArrowDownCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>No payments found</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {filteredPayments.map((payment) => (
                            <div
                              key={payment.id}
                              onClick={() => setSelectedPayment(payment)}
                              className="border rounded-lg p-4 hover:bg-muted/50 transition-colors cursor-pointer group"
                            >
                              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    {getStatusBadge(payment.escrow_status, payment.status)}
                                    <span className="text-sm text-muted-foreground">
                                      {payment.created_at && format(new Date(payment.created_at), "MMM d, yyyy")}
                                    </span>
                                  </div>
                                  <p className="font-medium">
                                    {payment.description || payment.payment_type}
                                  </p>
                                  {payment.released_at && (
                                    <p className="text-sm text-muted-foreground">
                                      Released: {format(new Date(payment.released_at), "MMM d, yyyy 'at' h:mm a")}
                                    </p>
                                  )}
                                </div>

                                <div className="flex items-center gap-4">
                                  <div className="lg:text-right space-y-1">
                                    <div className="grid grid-cols-3 gap-4 text-sm">
                                      <div>
                                        <p className="text-muted-foreground">Gross</p>
                                        <p className="font-medium">
                                          {payment.currency} {(payment.gross_amount || payment.amount).toLocaleString()}
                                        </p>
                                      </div>
                                      <div>
                                        <p className="text-muted-foreground">Fee ({payment.platform_fee_percentage || 1}%)</p>
                                        <p className="font-medium text-destructive">
                                          -{payment.currency} {(payment.platform_fee || 0).toLocaleString()}
                                        </p>
                                      </div>
                                      <div>
                                        <p className="text-muted-foreground">You Receive</p>
                                        <p className="font-bold text-green-600">
                                          {payment.currency} {(payment.net_amount || payment.amount).toLocaleString()}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                  <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>

      {/* Payment Details Modal */}
      <Dialog open={!!selectedPayment} onOpenChange={() => setSelectedPayment(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Payment Details
            </DialogTitle>
          </DialogHeader>

          {selectedPayment && (
            <div className="space-y-6">
              {/* Status & Description */}
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-lg">
                    {selectedPayment.description || selectedPayment.payment_type}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    ID: {selectedPayment.id.slice(0, 8)}...
                  </p>
                </div>
                {getStatusBadge(selectedPayment.escrow_status, selectedPayment.status)}
              </div>

              <Separator />

              {/* Amount Breakdown */}
              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Amount Breakdown
                </h4>
                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Gross Amount</span>
                    <span className="font-medium">
                      {selectedPayment.currency} {(selectedPayment.gross_amount || selectedPayment.amount).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-destructive">
                    <span>Platform Fee ({selectedPayment.platform_fee_percentage || 1}%)</span>
                    <span>-{selectedPayment.currency} {(selectedPayment.platform_fee || 0).toLocaleString()}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Net Amount (You Receive)</span>
                    <span className="text-green-600">
                      {selectedPayment.currency} {(selectedPayment.net_amount || selectedPayment.amount).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Transaction Timeline */}
              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Transaction Timeline
                </h4>
                <div className="space-y-4">
                  {getStatusTimeline(selectedPayment).map((step, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className={`rounded-full p-1.5 ${step.completed ? 'bg-green-100 text-green-600' : 'bg-muted text-muted-foreground'}`}>
                        {step.completed ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <Clock className="h-4 w-4" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className={`font-medium ${!step.completed && 'text-muted-foreground'}`}>
                          {step.label}
                        </p>
                        {step.date && step.completed && (
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(step.date), "MMM d, yyyy 'at' h:mm a")}
                          </p>
                        )}
                      </div>
                      {index < getStatusTimeline(selectedPayment).length - 1 && (
                        <ArrowRight className="h-4 w-4 text-muted-foreground mt-1" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Additional Details */}
              <div className="space-y-3">
                <h4 className="font-medium">Additional Details</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Payment Type</p>
                    <p className="font-medium">{selectedPayment.payment_type}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Currency</p>
                    <p className="font-medium">{selectedPayment.currency}</p>
                  </div>
                  {selectedPayment.payment_method && (
                    <div>
                      <p className="text-muted-foreground">Payment Method</p>
                      <p className="font-medium">{selectedPayment.payment_method}</p>
                    </div>
                  )}
                  {selectedPayment.transaction_id && (
                    <div>
                      <p className="text-muted-foreground">Transaction ID</p>
                      <p className="font-medium font-mono text-xs">{selectedPayment.transaction_id}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </WorkerPortalLayout>
  );
}
