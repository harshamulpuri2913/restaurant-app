'use client'

export default function ContactFooter() {
  return (
    <div className="bg-deep-brown border-t-2 border-golden py-6 mt-8">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <p className="text-cream text-base font-traditional mb-2">
          💬 If you need any assistance, please don't hesitate to reach out to us. We're here to help! 😊
        </p>
        <a
          href="tel:2095978565"
          className="inline-block text-golden text-xl font-bold hover:text-light-gold transition-colors font-traditional"
        >
          📞 209-597-8565
        </a>
      </div>
    </div>
  )
}

