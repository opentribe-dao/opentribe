import { getDictionary } from "@packages/i18n";
import { createSiteMetadata } from "@packages/seo/meta";
import type { Metadata } from "next";
import { ContactForm } from "./components/contact-form";

type ContactProps = {
  params: Promise<{
    locale: string;
  }>;
};

export const generateMetadata = async ({
  params,
}: ContactProps): Promise<Metadata> => {
  const { locale } = await params;
  const dictionary = await getDictionary(locale);

  return createSiteMetadata({
    title: dictionary.seo.contact.title,
    description: dictionary.seo.contact.description,
    keywords: dictionary.seo.contact.keywords,
    image: "/api/og?title=Contact Us",
  });
};

const Contact = async ({ params }: ContactProps) => {
  const { locale } = await params;
  const dictionary = await getDictionary(locale);

  return <ContactForm dictionary={dictionary} />;
};

export default Contact;
