import React, { useState, useEffect } from "react";

const testimonials = [
  {
    id: 1,
    imageUrl: "https://www.usebyte.com/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Fmarvelich.e8dfe08a.png&w=640&q=75", 
    quote: "Before I use to mix my business money with my personal account, making it tough to track my business money. But since I started using this app, I now separate my business money from my personal money and never worry about where my business money is going.",
    name: "Chidinma Marvelous Okpara",
    occupation: "Marvelrich",
  },
  {
    id: 2,
    imageUrl: "https://www.usebyte.com/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Fjeedarh.c1a3f07a.png&w=640&q=75",
    quote: "I used to accept payments via my personal account because I thought opening a business account was complicated. But when I found Vmonie, they opened my business account without any of these hassles. It took under a minute to start using it.",
    name: "Jamila Ismail",
    occupation: "Jeedarh Clothing",
  },
  {
    id: 3,
    imageUrl: "https://www.usebyte.com/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Fjames.7e204d14.png&w=640&q=75", 
    quote: "As a freelance designer, I used to share my personal account with clients, but they were worried about the lack of a formal business account and invoice. But Byte solved all my problems by providing a business account and easy invoicing, which made my clients feel more secured with me",
    name: "James Martins",
    occupation: "Freelancer",
  },
];

const TestimonialSlider = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentSlide((prevSlide) => (prevSlide + 1) % testimonials.length);
    }, 5000); 


    return () => clearInterval(intervalId);
  }, []);

  const nextSlide = (index) => {
    setCurrentSlide(index);
  };

  return (
    <div className="flex flex-col md:flex-row justify-between items-center mt-16  bg-secondary">
      <div className="md:w-1/2 md:pr-8 px-4 md:px-16">
        <h2 className="text-2xl md:text-4xl py-8 md:py-0 font-bold static text-gray-800 mb-0 md:mb-16">
        It’s not a theory, it’s a fact. Hear what Byte customers have to say.
        </h2>
        <p className="text-base md:text-lg font-medium text-gray-600 mb-4 md:mb-16">
          {testimonials[currentSlide].quote}
        </p>
        <div className="flex items-center space-x-2  mb-4">
          {testimonials.map((_, index) => (
            <span
              key={index}
              className={`h-2 w-8 rounded-full cursor-pointer ${
                currentSlide === index ? "bg-gray-800" : "bg-gray-300"
              }`}
              onClick={() => nextSlide(index)}
            ></span>
          ))}
        </div>
        <div className="mb-6 md:mb-0">
          <p className="font-bold text-lg text-gray-800">
            {testimonials[currentSlide].name}
          </p>
          <p className="text-sm text-gray-600">
            {testimonials[currentSlide].occupation}
          </p>
        </div>
      </div>

      <div className="md:w-1/2">
        <img
          src={testimonials[currentSlide].imageUrl}
          alt={testimonials[currentSlide].name}
          className="w-full h-auto rounded-lg"
        />
      </div>
    </div>
  );
};

export default TestimonialSlider;
