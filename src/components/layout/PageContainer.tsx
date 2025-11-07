import React from 'react';

interface PageContainerProps {
  children: React.ReactNode;
  title?: string;
  actions?: React.ReactNode;
}

export const PageContainer: React.FC<PageContainerProps> = ({ 
  children, 
  title,
  actions 
}) => {
  return (
    <div className="flex-1 overflow-auto">
      <div className="mx-auto px-4 sm:px-6 md:px-8 py-6">
        {(title || actions) && (
          <div className="md:flex md:items-center md:justify-between mb-6">
            {title && (
              <div className="flex-1 min-w-0">
                <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                  {title}
                </h2>
              </div>
            )}
            {actions && (
              <div className="mt-4 flex md:mt-0 md:ml-4">
                {actions}
              </div>
            )}
          </div>
        )}
        {children}
      </div>
    </div>
  );
};