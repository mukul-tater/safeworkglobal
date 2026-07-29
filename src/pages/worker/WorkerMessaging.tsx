import WorkerPortalLayout from "@/components/layout/WorkerPortalLayout";
import PortalBreadcrumb from "@/components/PortalBreadcrumb";
import MessagingInbox from "@/components/messaging/MessagingInbox";

export default function WorkerMessaging() {
  return (
    <WorkerPortalLayout>
      <PortalBreadcrumb />
      <h1 className="text-2xl md:text-3xl font-bold mb-4 md:mb-6">Messages</h1>
      <MessagingInbox />
    </WorkerPortalLayout>
  );
}
