import React from 'react';

interface AvatarProps {
  alt?: string;
  img?: string;
  rounded?: boolean;
  className?: string;
}

const Avatar: React.FC<AvatarProps> = ({
  alt = 'Avatar',
  img,
  rounded = false,
  className = '',
}) => {
  const baseClasses = 'inline-block';
  const roundedClasses = rounded ? 'rounded-full' : 'rounded-lg';
  const sizeClasses = 'w-10 h-10';
  
  if (img) {
    return (
      <img
        src={img}
        alt={alt}
        className={`${baseClasses} ${roundedClasses} ${sizeClasses} ${className}`}
      />
    );
  }
  
  return (
    <div className={`${baseClasses} ${roundedClasses} ${sizeClasses} bg-gray-600 flex items-center justify-center ${className}`}>
      <span className="text-white font-medium text-sm">
        {alt.charAt(0).toUpperCase()}
      </span>
    </div>
  );
};

export default Avatar;