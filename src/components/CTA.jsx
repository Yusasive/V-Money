import React from 'react';
import {Link} from 'react-router-dom';

const CTA = () => {
  return (
    <div className="px-[35px] font-lota space-y-4">
      <h1 className="text-[67px] text-center font-bold text-[#30333b] px-[16%] leading-height">Position your business for success with Vmonie.</h1>
      <h3 className="text-lg text-center text-[#30333b] font-bold">Join thousands of businesses who:</h3>
      <p className="text-lg text-center px-[16%] text-[#808691] font-medium">Already use Vmonie to grow and scale their business, get access to POS terminals, business accounts, business tools and access to top tier loans to grow your business.</p>
      <div className="my-6 px-[18%] space-x-6 flex justify-center">
  <Link to="/" className="py-[18px] px-5 bg-[#232846] hover:bg-[#6a78d1] rounded-xl text-white text-center">
    Get Started for free
  </Link>
  <Link to="/" className="py-[18px] px-12 bg-[#eff1fa] hover:bg-[#6a78d1] rounded-xl text-[#5864ae] text-center hover:text-white">
    Talk to sales
  </Link>
</div>

    
    </div>
  )
}




export default CTA;
