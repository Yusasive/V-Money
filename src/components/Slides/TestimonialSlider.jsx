import React, { useState, useEffect } from "react";
import { useContent } from "../../hooks/useContent";

const TestimonialSlider = () => {
  const { content, loading } = useContent('testimonial');
  const [currentSlide, setCurrentSlide] = useState(0);
  
  const testimonials = content?.testimonials || [];

  useEffect(() => {
    if (testimonials.length === 0) return;
    
    const intervalId = setInterval(() => {
      setCurrentSlide((prevSlide) => (prevSlide + 1) % testimonials.length);
    }, 3000); 

    return () => clearInterval(intervalId);
  }, [testimonials.length]);

  const nextSlide = (index) => {
    setCurrentSlide(index);
  };

  if (loading) {
    return <div className="py-16 text-center">Loading testimonials...</div>;
  }

  if (!testimonials.length) {
    return null;
  }

  return (
    <div className="flex flex-col md:flex-row justify-between items-center mt-16  bg-secondary">
      <div className="md:w-1/2 md:pr-8 px-4 md:px-16">
        <h2 className="text-2xl md:text-4xl py-8 md:py-0 font-bold static text-gray-800 mb-0 md:mb-16">
          {content?.title || "It's not a theory, it's a fact. Hear what Vmonie customers have to say."}
        </h2>
        <p className="text-base md:text-lg font-medium text-gray-600 mb-4 md:mb-16">
          {testimonials[currentSlide].quote}
        </p>
        <div className="flex items-center space-x-2  mb-4">
          {testimonials.map((_, index) => (
            <span
              key={index}
              className={`h-2 w-20 rounded-full cursor-pointer ${
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
