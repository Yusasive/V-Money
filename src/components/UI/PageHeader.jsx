import React from 'react';
import { motion } from 'framer-motion';

const PageHeader = ({ 
  title, 
  subtitle, 
  icon: Icon, 
  actions = null,
  breadcrumbs = null 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8"
    >
      {breadcrumbs && (
        <nav className="mb-4">
          <ol className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
            {breadcrumbs.map((crumb, index) => (
              <li key={index} className="flex items-center">
                {index > 0 && <span className="mx-2">/</span>}
                {crumb.href ? (
                  <a href={crumb.href} className="hover:text-primary">
                    {crumb.label}
                  </a>
                ) : (
                  <span className="text-gray-900 dark:text-white font-medium">
                    {crumb.label}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      )}
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          {Icon && (
            <div className="h-10 w-10 lg:h-12 lg:w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
              <Icon className="h-5 w-5 lg:h-6 lg:w-6" />
            </div>
          )}
          <div>
            <h1 className="text-xl lg:text-3xl font-bold text-gray-900 dark:text-white font-lota">
              {title}
            </h1>
            {subtitle && (
              <p className="text-sm lg:text-base text-gray-600 dark:text-gray-400 mt-1">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        
        {actions && (
          <div className="flex items-center gap-3">
            {actions}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default PageHeader;