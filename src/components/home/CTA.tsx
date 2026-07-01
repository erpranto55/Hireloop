import Image from "next/image";
import Link from "next/link";

export default function CTA() {
    return (
        <section className="relative overflow-hidden bg-black">
            <div className="container mx-auto px-6">
                <div className="relative flex min-h-162.5 items-center justify-center">
                    {/* Background Grid */}
                    <Image
                        src="/images/cta-bg.png"
                        alt="CTA Background"
                        fill
                        priority
                        className="object-contain object-top opacity-90 pointer-events-none select-none"
                    />

                    {/* Purple Glow */}
                    <div className="absolute top-0 left-1/2 h-75 w-175 -translate-x-1/2 rounded-full bg-indigo-600/30 blur-[140px]" />

                    {/* Content */}
                    <div className="relative z-10 mx-auto max-w-4xl text-center">
                        <h2 className="text-4xl font-semibold tracking-tight text-white md:text-6xl md:leading-tight">
                            Your next role is
                            <br />
                            already looking for you
                        </h2>

                        <p className="mx-auto mt-6 max-w-2xl text-base text-zinc-400 md:text-lg">
                            Build a profile in three minutes. The matches
                            start arriving tomorrow morning.
                        </p>

                        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                            <Link
                                href="/register"
                                className="rounded-xl bg-white px-6 py-3 text-sm font-medium text-black transition hover:bg-zinc-200"
                            >
                                Create a free account
                            </Link>

                            <Link
                                href="/pricing"
                                className="rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-medium text-white backdrop-blur-xl transition hover:bg-white/10"
                            >
                                View pricing
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}