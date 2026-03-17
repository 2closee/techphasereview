import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { HelpCircle } from "lucide-react";

const faqs = [
  {
    question: "What programs does the academy offer?",
    answer: "We offer both software-based and hardware-based ICT training programs including Web Development, Mobile App Development, Data Science, Cybersecurity, Computer Hardware Engineering, Networking, and more.",
  },
  {
    question: "How long are the training programs?",
    answer: "Most programs run for 6 months with classes held 2–3 times per week. Some advanced or certification-focused programs may extend to 9–12 months.",
  },
  {
    question: "Where are the training centers located?",
    answer: "We currently operate training centers in Port Harcourt (Rivers State) and Warri (Delta State). You can choose your preferred location during registration.",
  },
  {
    question: "What are the requirements for enrollment?",
    answer: "Applicants must be at least 16 years old and possess a minimum of SSCE/WAEC or equivalent. No prior tech experience is required.",
  },
  {
    question: "How much is the tuition and registration fee?",
    answer: "Fees vary by program. A non-refundable registration fee is required to secure your spot, and tuition can be paid in full or via our partial payment plan.",
  },
  {
    question: "Are scholarships available?",
    answer: "Yes! We offer need-based scholarships ranging from 30% to 100% tuition discount. After registration, you can apply directly from your student dashboard.",
  },
  {
    question: "Can I pay in installments?",
    answer: "Yes. We offer a partial payment plan where you pay a percentage upfront and the remaining balance before a specified deadline.",
  },
  {
    question: "What happens after I register?",
    answer: "After submitting your application, you'll pay the registration fee. Once confirmed, a student account is created and you gain access to your dashboard.",
  },
  {
    question: "Will I receive a certificate?",
    answer: "Yes. Upon successful completion, you receive a certificate. Some programs also include industry-recognized certifications from our partners.",
  },
  {
    question: "How is my personal data used?",
    answer: "By registering, you agree to our Terms and Conditions which include consent for data use. See our full Terms & Conditions for details.",
  },
];

const FAQSection = () => {
  return (
    <section id="faq" className="py-24 bg-secondary text-secondary-foreground">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <span className="font-mono text-primary font-medium text-sm uppercase tracking-wider">
            // faq
          </span>
          <h2 className="text-3xl md:text-5xl font-display font-bold mt-4 mb-6">
            Frequently Asked <span className="text-primary">Questions</span>
          </h2>
          <p className="text-secondary-foreground/60 text-lg font-body">
            Everything you need to know about our training programs and enrollment.
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`faq-${index}`}
                className="border border-secondary-foreground/10 rounded-lg px-6 bg-secondary-foreground/5"
              >
                <AccordionTrigger className="text-left font-body font-medium text-secondary-foreground hover:no-underline py-5">
                  <div className="flex items-start gap-3">
                    <HelpCircle className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                    <span>{faq.question}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-secondary-foreground/60 font-body pl-8 pb-5">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;