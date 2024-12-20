import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const FAQs = () => {
  const [activeIndex, setActiveIndex] = useState(null);

  const toggleFAQ = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };


  const faqVariants = {
    hidden: { opacity: 0, height: 0 },
    visible: { opacity: 1, height: "auto" },
    exit: { opacity: 0, height: 0 },
  };


  const rotateVariants = {
    initial: { rotate: 0 },
    active: { rotate: 45 },
  };

  return (
    <div className="py-24 px-4 lg:px-16 flex flex-col">
      <div className="flex flex-col text-left mb-10">
        <p className="inline-block font-semibold text-black text-[36px] lg:text-[54px]">
          FAQ
        </p>
      </div>

      <ul className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10">
        {faqData.map((item, index) => (
          <li key={index}>
            <button
              className="relative flex gap-2 items-center w-full py-5 text-base font-lota font-bold text-left border-t border-gray-200"
              aria-expanded={activeIndex === index}
              onClick={() => toggleFAQ(index)}
            >

              <span className="flex-1 text-base-content">{item.question}</span>
      
              <motion.svg
                className="flex-shrink-0 w-5 h-5 ml-auto text-primary fill-current"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 16 16"
                variants={rotateVariants}
                animate={activeIndex === index ? "active" : "initial"}
                transition={{ duration: 0.3 }}
              >
                <rect y="7" width="16" height="2" rx="1"></rect>
                <rect x="7" width="2" height="16" rx="1"></rect>
              </motion.svg>
            </button>

            <AnimatePresence>
              {activeIndex === index && (
                <motion.div
                  className="overflow-hidden"
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  variants={faqVariants}
                  transition={{ duration: 0.4, ease: "easeInOut" }}
                >
                  <div className="pb-5 leading-relaxed">
                    <div className="space-y-2 text-base font-normal text-gray-700 leading-relaxed font-lota">
                      {item.answer}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </li>
        ))}
      </ul>
    </div>
  );
};

const faqData = [
  {
    question: "What do I need to know about getting my business account?",
    answer:
      "Your business account will be in your business name like: John Electronics limited. You don't require any documents like CAC documents to get the business account. You get the account in less than 1 mins and start receiving money instantly.",
  },
  {
    question: "Can anyone with any bank send money to me in this account?",
    answer:
      "Yes, you can receive money from all banks in Nigeria. You can also send money to any bank in Nigeria.",
  },
  {
    question: "Are there charges on the account?",
    answer:
      "No, we don't charge you to deposit money or send (withdraw) money to any account.",
  },
  {
    question: "Is there a limit to how much I can receive into the account?",
    answer:
      "No, there is no limit to the amount you can receive or withdraw from the account.",
  },
  {
    question: "Is your customer service responsive?",
    answer:
      "Yes, we even give you a personal account manager once you sign up.",
  },
];

export default FAQs;
