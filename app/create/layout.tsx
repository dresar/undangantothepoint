export default function CreateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="fixed inset-0" style={{ marginLeft: 0 }}>{children}</div>;
}

