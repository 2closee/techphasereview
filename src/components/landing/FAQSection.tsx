import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { HelpCircle } from "lucide-react";

const faqs = [
  {
    question: "What programs does the academy offer?",
    answer:
      "We offer both software-based and hardware-based ICT training programs including Web Development, Mobile App Development, Data Science, Cybersecurity, Computer Hardware Engineering, Networking, and more. Each program is designed to take you from beginner to job-ready professional.",
  },
  {
    question: "How long are the training programs?",
    answer:
      "Most programs run for 6 months with classes held 2–3 times per week. Some advanced or certification-focused programs may extend to 9–12 months depending on the curriculum.",
  },
  {
    question: "Where are the training centers located?",
    answer:
      "We currently operate training centers in Port Harcourt (Rivers State) and Warri (Delta State). You can choose your preferred location during registration.",
  },
  {
    question: "What are the requirements for enrollment?",
    answer:
      "Applicants must be at least 16 years old and possess a minimum of SSCE/WAEC or equivalent. No prior tech experience is required — our programs are designed for complete beginners as well as those with some background.",
  },
  {
    question: "How much is the tuition and registration fee?",
    answer:
      "Fees vary by program. A non-refundable registration fee is required to secure your spot, and tuition can be paid in full or via our partial payment plan. Visit the enrollment page to see specific program fees.",
  },
  {
    question: "Are scholarships available?",
    answer:
      "Yes! We offer need-based scholarships ranging from 30% to 100% tuition discount. After completing registration and paying the registration fee, you can apply for a scholarship directly from your student dashboard.",
  },
  {
    question: "Can I pay in installments?",
    answer:
      "Yes. We offer a partial payment plan where you pay a percentage upfront and the remaining balance before a specified deadline. You can also pay at the office via bank transfer.",
  },
  {
    question: "What happens after I register?",
    answer:
      "After submitting your application, you will proceed to make your registration fee payment (online or via bank transfer). Once confirmed, a student account will be created for you and you'll gain access to your student dashboard.",
  },
  {
    question: "Will I receive a certificate after completing the program?",
    answer:
      "Yes. Upon successful completion of your program, you will receive a certificate of completion. Some programs also include industry-recognized certifications from our partner organizations.",
  },
  {
    question: "How is my personal data used?",
    answer:
      "By registering, you agree to our Terms and Conditions which include consent for your data to be shared with third-party partners for scholarship opportunities and economic development research. You can revoke this consent with 7 days' written notice. See our full Terms & Conditions for details.",
  },
];

const FAQSection = () => {
  return (
    <section id="faq" className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <span className="text-primary font-semibold text-sm uppercase tracking-wider font-body">
            FAQ
          </span>
          <h2 className="text-3xl md:text-5xl font-display font-bold mt-4 mb-6 text-foreground">
            Frequently Asked <span className="text-primary">Questions</span>
          </h2>
          <p className="text-muted-foreground text-lg font-body">
            Everything you need to know about our training programs and enrollment process.
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`faq-${index}`}
                className="border border-border rounded-lg px-6 bg-card shadow-soft"
              >
                <AccordionTrigger className="text-left font-body font-medium text-foreground hover:no-underline py-5">
                  <div className="flex items-start gap-3">
                    <HelpCircle className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                    <span>{faq.question}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground font-body pl-8 pb-5">
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
