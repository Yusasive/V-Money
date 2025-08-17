import React from "react";
import { useContent } from "../../hooks/useContent";

const Suite = () => {
  const { content, loading } = useContent('suite');

  if (loading) {
    return <div className="py-12 text-center">Loading...</div>;
  }

  return (
    <div className="px-4 lg:px-16 py-12">
      <h1 className="text-4xl lg:text-[54px] font-bold font-lota text-center lg:px-32 leading-tight">
        {content?.title || "A simplified suite of tools to run a smarter business."}
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-10">
        {(content?.features || []).map((feature, index) => (
          <div key={index} className="text-left">
            <div className="text-2xl mb-4">{feature.icon}</div>
            <h3 className="text-2xl font-semibold mb-2">{feature.title}</h3>
            <p className="text-gray-500 text-sm">{feature.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Suite;
