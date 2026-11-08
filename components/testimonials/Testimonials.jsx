"use client";
import { TESTIMONIALS } from "@/lib/data";
import { Star, Quote } from "lucide-react";
import { Card } from "@/ui/Card";
import { Avatar, AvatarImage, AvatarFallback } from "@/ui/Avatar";
export function Testimonials() {
    return (<section className="bg-white mt-24 sm:mt-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold text-wonderlust-primary uppercase tracking-widest">
            Testimonials
          </p>
          <h2 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
            Loved by travellers
          </h2>
          <p className="mt-4 text-lg text-slate-500">
            Don&apos;t just take our word for it. Here&apos;s what our travellers say.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
          {TESTIMONIALS.map((testimonial) => (<Card key={testimonial.id} className="p-6">
              <div className="flex gap-1 text-amber-400">
                {Array.from({ length: testimonial.rating }).map((_, i) => (<Star key={i} className="h-4 w-4 fill-current"/>))}
              </div>
              <p className="mt-4 text-sm leading-relaxed text-slate-600">
                <Quote className="inline h-4 w-4 mr-1 text-slate-300"/>
                {testimonial.quote}
              </p>
              <div className="mt-6 flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={testimonial.avatar} alt={testimonial.name}/>
                  <AvatarFallback className="rounded-lg bg-slate-200 text-slate-600">
                    {testimonial.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {testimonial.name}
                  </p>
                  <p className="text-xs text-slate-400">{testimonial.location}</p>
                </div>
              </div>
            </Card>))}
        </div>
      </div>
    </section>);
}
