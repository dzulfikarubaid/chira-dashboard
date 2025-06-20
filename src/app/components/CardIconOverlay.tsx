import React from 'react';

const CardIconOverlay = ({ icon: IconComponent }:any) => {
  return (
    <div className='absolute top-3 right-3 text-slate-200'>
      <IconComponent size={48} />
    </div>
  );
};

export default CardIconOverlay;