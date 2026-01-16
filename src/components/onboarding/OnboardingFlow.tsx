import { useState } from 'react';
import { Sun, Target, Timer, ArrowRight, ChevronRight, ChevronLeft, Clock } from 'lucide-react';
import Button from '../ui/Button';

interface OnboardingFlowProps {
  onComplete: () => void;
}

const steps = [
  {
    icon: Sun,
    title: 'Your Day, Your Way',
    description: 'YNAHT tracks your day from when you wake up to when you sleep - not midnight to midnight. This matches how you actually experience time.',
    tip: 'Example: Wake at 7am, sleep at 1am = 18-hour day',
  },
  {
    icon: Target,
    title: 'Weekly Goals Run in Background',
    description: 'Set goals like "Yoga 3x per week" or "Read 2 hours weekly". YNAHT tracks your progress and nudges you when you\'re falling behind.',
    tip: 'Goals influence your planning without dominating it',
  },
  {
    icon: Timer,
    title: 'Track Time, Improve Estimates',
    description: 'Use the built-in timer or enter time manually. Over time, YNAHT learns how long activities actually take you and helps you plan more accurately.',
    tip: 'Pause and resume timers as needed - they persist across sessions',
  },
  {
    icon: Clock,
    title: 'Budget Your Time Like Money',
    description: 'See how much time you have left in your day, allocate it to activities, and get warnings when you\'re overcommitted.',
    tip: 'Keep a 15% buffer for unexpected tasks',
  },
];

export default function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [showWelcome, setShowWelcome] = useState(true);

  if (showWelcome) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-100 flex items-center justify-center p-4">
        <div className="max-w-lg w-full">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            {/* Logo/Icon */}
            <div className="w-20 h-20 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Clock className="w-10 h-10 text-primary-600" />
            </div>

            {/* Title */}
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome to YNAHT
            </h1>
            <p className="text-lg text-gray-500 mb-6">
              You Need A Hour Tracker
            </p>

            {/* Description */}
            <p className="text-gray-600 mb-8 leading-relaxed">
              Budget your time like YNAB budgets money. Plan your day, track your activities, and achieve your goals - one hour at a time.
            </p>

            {/* Feature Highlights */}
            <div className="grid grid-cols-2 gap-4 mb-8 text-left">
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <Sun className="w-5 h-5 text-yellow-500 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900 text-sm">Wake-to-Sleep</p>
                  <p className="text-xs text-gray-500">Your day, your rhythm</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <Target className="w-5 h-5 text-green-500 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900 text-sm">Weekly Goals</p>
                  <p className="text-xs text-gray-500">Background intelligence</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <Timer className="w-5 h-5 text-blue-500 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900 text-sm">Time Tracking</p>
                  <p className="text-xs text-gray-500">Improve estimates</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <Clock className="w-5 h-5 text-purple-500 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900 text-sm">Smart Nudges</p>
                  <p className="text-xs text-gray-500">Stay on track</p>
                </div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="space-y-3">
              <Button onClick={() => setShowWelcome(false)} className="w-full justify-center">
                Get Started
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <button
                onClick={onComplete}
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Skip intro - I'll figure it out
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const StepIcon = step.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-100 flex items-center justify-center p-4">
      <div className="max-w-lg w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Progress Dots */}
          <div className="flex justify-center gap-2 mb-8">
            {steps.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentStep(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentStep
                    ? 'w-8 bg-primary-500'
                    : index < currentStep
                    ? 'bg-primary-300'
                    : 'bg-gray-300'
                }`}
              />
            ))}
          </div>

          {/* Step Content */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <StepIcon className="w-8 h-8 text-primary-600" />
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {step.title}
            </h2>

            <p className="text-gray-600 mb-4 leading-relaxed">
              {step.description}
            </p>

            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-50 rounded-lg text-sm text-primary-700">
              <span className="font-medium">Tip:</span>
              {step.tip}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
              className={`flex items-center gap-1 px-4 py-2 rounded-lg transition-colors ${
                currentStep === 0
                  ? 'text-gray-300 cursor-not-allowed'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>

            {isLastStep ? (
              <Button onClick={onComplete}>
                Start Planning
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={() => setCurrentStep(currentStep + 1)}>
                Next
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>

          {/* Skip Link */}
          <div className="text-center mt-4">
            <button
              onClick={onComplete}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Skip tutorial
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
