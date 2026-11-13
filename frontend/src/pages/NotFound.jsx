import React from 'react';
import { Link } from 'react-router-dom';
import Container from '../components/common/Container';
import Button from '../components/common/Button';
import { Compass, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="py-24 sm:py-32 flex items-center justify-center text-center">
      <Container size="narrow">
        <div className="w-16 h-16 rounded-full bg-forest text-gold flex items-center justify-center mx-auto mb-6 shadow-soft">
          <Compass className="w-8 h-8 animate-spin-slow" />
        </div>

        <span className="text-xs uppercase tracking-[0.25em] text-terracotta font-semibold block mb-2">
          404 Error &bull; Off the Path
        </span>

        <h1 className="font-serif text-4xl sm:text-5xl text-forest font-normal mb-4">
          This Gateway Does Not Exist
        </h1>

        <p className="text-base text-olive font-light max-w-md mx-auto mb-8 leading-relaxed">
          The sanctuary page or resource you are seeking has either moved or was not properly aligned. We invite you to return to our central path.
        </p>

        <Button to="/" variant="primary" size="lg" icon={ArrowLeft} iconPosition="left">
          Return to Sanctuary Home
        </Button>
      </Container>
    </div>
  );
}
