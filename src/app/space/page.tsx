import { PersonalSpace } from "@/components/personal-space";
export const metadata = { title: "Your Space" };
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  return (
    <PersonalSpace
      initialTab={tab === "notes" || tab === "learning" ? tab : "library"}
    />
  );
}
