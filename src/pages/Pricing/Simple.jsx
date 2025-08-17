import React from "react";
import { useContent } from "../../hooks/useContent";

const Simple = () => {
  const { content, loading } = useContent('pricing');

  if (loading) {
    return <div className="py-16 text-center">Loading...</div>;
  }

  return (
    <div className="py-16">
      <div className="flex flex-col lg:flex-row justify-between items-center px-4 lg:px-16">
        <h1 className="text-5xl lg:text-[54px] text-gray-800 font-lota font-bold pb-8">
          {content?.title || "Simple and transparent pricing to help you grow."}
        </h1>
        <p className="text-base text-gray-600 lg:ml-10 font-lota font-semibold">
          {content?.description || "To fuel your aspirations, Vmonie is free for starters. We'll back you up with optimal pricing as you flourish and expand."}
        </p>
      </div>
      <div className="w-full h-[400px] my-20 bg-cover bg-[url('https://res.cloudinary.com/ddxssowqb/image/upload/v1729579643/blob_tjtxhg.jpg')]">
       
      </div>
    </div>     
  );
};

export default Simple;
