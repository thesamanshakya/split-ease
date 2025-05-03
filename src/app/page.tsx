import Link from 'next/link';

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 text-indigo-700">
            Split Restaurant Bills Easily with SplitEase
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            The easiest way to split bills with friends, track expenses, and settle debts without the hassle.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-xl overflow-hidden mb-12">
          <div className="md:flex">
            <div className="md:w-1/2 p-8">
              <h2 className="text-2xl font-bold mb-4">How It Works</h2>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <div className="flex-shrink-0 h-6 w-6 bg-indigo-500 rounded-full flex items-center justify-center text-white font-bold mr-3">
                    1
                  </div>
                  <p>Create a group and add your friends</p>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 h-6 w-6 bg-indigo-500 rounded-full flex items-center justify-center text-white font-bold mr-3">
                    2
                  </div>
                  <p>Add a new expense with details and amount</p>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 h-6 w-6 bg-indigo-500 rounded-full flex items-center justify-center text-white font-bold mr-3">
                    3
                  </div>
                  <p>Choose to split equally or manually</p>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 h-6 w-6 bg-indigo-500 rounded-full flex items-center justify-center text-white font-bold mr-3">
                    4
                  </div>
                  <p>See who owes what and settle up</p>
                </li>
              </ul>
            </div>
            <div className="md:w-1/2 bg-indigo-100 p-8">
              <h2 className="text-2xl font-bold mb-4">Features</h2>
              <ul className="space-y-3 text-gray-800">
                <li className="flex items-center">
                  <svg className="h-5 w-5 text-indigo-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Easy expense tracking
                </li>
                <li className="flex items-center">
                  <svg className="h-5 w-5 text-indigo-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Equal or custom bill splitting
                </li>
                <li className="flex items-center">
                  <svg className="h-5 w-5 text-indigo-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Multiple groups for different occasions
                </li>
                <li className="flex items-center">
                  <svg className="h-5 w-5 text-indigo-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Clear debt visualization
                </li>
                <li className="flex items-center">
                  <svg className="h-5 w-5 text-indigo-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Simplified settling of debts
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="text-center">
          <Link
            href="/auth"
            className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg text-lg"
          >
            Get Started
          </Link>
        </div>
      </div>
    </div>
  );
}
