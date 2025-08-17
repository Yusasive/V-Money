import React from "react";
import { useContent } from "../../hooks/useContent";

const Credit = () => {
  const { content, loading } = useContent('credit');

  if (loading) {
    return <div className="py-12 text-center">Loading...</div>;
  }

  return (
    <div className="mx-4 lg:mx-16 py-12 bg-[#d6e3f0] rounded-lg">
      <h1 className="text-[30px] lg:text-[36px] font-medium font-lota lg:px-16 px-4 lg:w-[80%]">
        {content?.title ? (
          <span dangerouslySetInnerHTML={{ __html: content.title }} />
        ) : (
          <>
            <b>Get a 10X credit</b> of your business capital when you transact <b>with Vmonie.</b>
          </>
        )}
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-10 px-4 lg:px-16">
        {(content?.features || []).map((feature, index) => (
          <div key={index} className="flex flex-row text-left space-x-4">
            <div className="text-2xl mb-4 content-center">{feature.icon}</div>
            <div>
              <h3 className="text-[22px] font-bold mb-2 text-gray-800">{feature.title}</h3>
              <p className="font-normal text-sm">{feature.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Credit;
