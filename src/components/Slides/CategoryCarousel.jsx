import React from 'react';
import Carousel from 'react-multi-carousel';
import 'react-multi-carousel/lib/styles.css';

const categoryData = [
  {
    imageUrl: "https://www.usebyte.com/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Fstore.2.f806cd4b.png&w=1920&q=75",
    title: "Restaurants",
  },
  {
    imageUrl: "https://www.usebyte.com/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Fstore.3.0c2d0e18.png&w=1920&q=75",
    title: "Retail",
  },
  {
    imageUrl: "https://www.usebyte.com/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Fstore.5.06d0a3d9.png&w=1920&q=75",
    title: "Fashion",
  },
  {
    imageUrl: "https://www.usebyte.com/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Fstore.4.de3057c1.png&w=1920&q=75",
    title: "Beauty",
  },
];

// Responsive settings for different devices
const responsive = {
  desktop: {
    breakpoint: { max: 3000, min: 1024 },
    items: 4,
    slidesToSlide: 1, // Number of slides to scroll
  },
  tablet: {
    breakpoint: { max: 1024, min: 464 },
    items: 2,
    slidesToSlide: 1,
  },
  mobile: {
    breakpoint: { max: 464, min: 0 },
    items: 1,
    slidesToSlide: 1,
  },
};

const CategoryCarousel = () => {
  return (
    <Carousel
      responsive={responsive}
      swipeable={true}
      draggable={false}
      showDots={false}
      infinite={true}
      autoPlay={true}
      autoPlaySpeed={5000}
      keyBoardControl={true}
      transitionDuration={500}
      containerClass="carousel-container"
      removeArrowOnDeviceType={["tablet", "mobile", "desktop"]}
      itemClass="carousel-item"
      dotListClass="custom-dot-list"
    >
      {categoryData.map((category, index) => (
        <div key={index} className="relative group overflow-hidden rounded-lg md:mr-4">
          <img
            src={category.imageUrl}
            alt={category.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 z-40 bg-black bg-opacity-40 flex justify-start pl-6 pb-10 items-end transition-opacity duration-300">
            <div className="text-center">

              <button className="flex flex-row  text-white font-medium px-8 py-3 bg-white bg-opacity-40 rounded-xl border-[1px] border-white ">
                Explore <span className='bg-white ml-5 text-black px-1 rounded-full'>→</span>
              </button>
            </div>
          </div>
        </div>
      ))}
    </Carousel>
  );
};

export default CategoryCarousel;
