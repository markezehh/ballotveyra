"use client";

import Link from "next/link";
import { useState } from "react";
import { BrandMark, ArrowIcon } from "@/components/brand";

const included = [
	"Unlimited elections",
	"Secure eligible-voter roster",
	"Private invitation links",
	"Flexible voting schedules",
	"Live turnout and results",
	"Voter support tools",
];

export default function PricingPage() {
	const [voters, setVoters] = useState(500);

	return (
		<div className="min-h-screen bg-[#fbfcfa]">
			<header className="border-b border-[#10243f]/8 bg-white">
				<nav
					className="mx-auto flex h-20 max-w-[1180px] items-center justify-between px-5 sm:px-8"
					aria-label="Main navigation"
				>
					<Link
						href="/"
						className="flex items-center gap-3"
						aria-label="BallotVeyra home"
					>
						<BrandMark />
						<span className="text-[20px] font-bold tracking-tight text-[#10243f]">
							BallotVeyra
						</span>
					</Link>
					<div className="hidden items-center gap-8 text-sm font-semibold text-[#3d4f64] md:flex">
						<Link
							href="/#how-it-works"
							className="transition-colors hover:text-[#13877d]"
						>
							How it works
						</Link>
						<Link
							href="/pricing"
							aria-current="page"
							className="text-[#13877d]"
						>
							Pricing
						</Link>
						<Link
							href="/help"
							className="transition-colors hover:text-[#13877d]"
						>
							Help
						</Link>
					</div>
					<Link
						href="/register"
						className="flex h-11 items-center gap-2 rounded-lg bg-[#10243f] px-4 text-sm font-bold text-white sm:px-5"
					>
						Get started <ArrowIcon />
					</Link>
				</nav>
			</header>

			<main>
				<section className="relative overflow-hidden border-b border-[#10243f]/8">
					<div className="hero-glow absolute inset-0" />
					<div className="relative mx-auto max-w-[1180px] px-5 py-16 text-center sm:px-8 sm:py-20">
						<p className="text-xs font-bold uppercase tracking-[0.18em] text-[#13877d]">
							Simple, transparent pricing
						</p>
						<h1 className="mx-auto mt-4 max-w-[760px] text-4xl font-bold leading-tight tracking-[-0.04em] text-[#10243f] sm:text-6xl">
							Pay for the people you invite to vote.
						</h1>
						<p className="mx-auto mt-5 max-w-[620px] text-lg leading-8 text-[#657487]">
							One clear price for every election. No subscriptions, hidden platform
							fees, or surprise charges.
						</p>
					</div>
				</section>

				<section className="mx-auto max-w-[1180px] px-5 py-12 sm:px-8 sm:py-16">
					<div className="grid items-stretch gap-6 lg:grid-cols-[1fr_1.08fr]">
						<article className="relative overflow-hidden rounded-[24px] border border-[#1aa79a]/25 bg-white p-7 ballot-shadow sm:p-10">
							<div className="absolute right-6 top-6 rounded-full bg-[#edf8f6] px-3 py-1.5 text-xs font-bold text-[#13877d]">
								Pay as you run
							</div>
							<p className="text-sm font-bold text-[#13877d]">One election plan</p>
							<div className="mt-5 flex items-end gap-2">
								<span className="text-7xl font-bold tracking-[-0.06em] text-[#10243f]">
									$1
								</span>
								<span className="pb-3 text-base font-bold text-[#718093]">
									per eligible voter
								</span>
							</div>
							<p className="mt-5 max-w-[440px] leading-7 text-[#657487]">
								Add your eligible voter roster, run the election, and pay only for
								the voters eligible to participate.
							</p>

							<Link
								href="/register"
								className="mt-8 flex h-13 items-center justify-center gap-2 rounded-lg bg-[#1aa79a] px-6 text-sm font-bold text-white shadow-[0_10px_24px_rgba(26,167,154,.18)] transition-all hover:-translate-y-0.5 hover:bg-[#13877d]"
							>
								Create an election <ArrowIcon />
							</Link>

							<div className="mt-8 grid gap-3 border-t border-[#10243f]/8 pt-7 sm:grid-cols-2">
								{included.map((feature) => (
									<div
										key={feature}
										className="flex items-center gap-2.5 text-sm font-semibold text-[#58687a]"
									>
										<span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#edf8f6] text-[#13877d]">
											<svg
												viewBox="0 0 20 20"
												className="h-3.5 w-3.5"
												aria-hidden="true"
											>
												<path
													d="m5 10 3 3 7-7"
													fill="none"
													stroke="currentColor"
													strokeWidth="2.2"
													strokeLinecap="round"
													strokeLinejoin="round"
												/>
											</svg>
										</span>
										{feature}
									</div>
								))}
							</div>
						</article>

						<aside className="rounded-[24px] bg-[#10243f] p-7 text-white sm:p-10">
							<p className="text-xs font-bold uppercase tracking-[0.16em] text-[#68d4c7]">
								Estimate your election
							</p>
							<h2 className="mt-3 text-3xl font-bold tracking-tight">
								What will I pay?
							</h2>
							<p className="mt-3 text-sm leading-6 text-[#bdc9d5]">
								Enter or select the number of eligible voters in your roster.
							</p>

							<div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.06] p-5 sm:p-6">
								<label className="block">
									<span className="text-xs font-bold uppercase tracking-[0.12em] text-[#9fb0c0]">
										Eligible voters
									</span>
									<div className="mt-2 flex items-center rounded-xl border border-white/15 bg-[#10243f] px-4 focus-within:border-[#68d4c7]">
										<input
											aria-label="Number of eligible voters"
											type="number"
											min="1"
											max="100000"
											value={voters}
											onChange={(event) => {
												const value = Number(event.target.value);
												setVoters(
													Number.isFinite(value)
														? Math.min(100000, Math.max(1, value))
														: 1
												);
											}}
											className="h-14 w-full bg-transparent text-3xl font-bold tabular-nums text-white outline-none"
										/>
										<span className="ml-3 text-sm font-semibold text-[#9fb0c0]">
											voters
										</span>
									</div>
								</label>

								<div className="mt-5 grid grid-cols-4 gap-2">
									{[100, 500, 1000, 5000].map((preset) => (
										<button
											key={preset}
											type="button"
											onClick={() => setVoters(preset)}
											className={`h-9 rounded-lg border text-xs font-bold transition-colors ${
												voters === preset
													? "border-[#68d4c7] bg-[#68d4c7]/15 text-[#68d4c7]"
													: "border-white/10 text-[#bdc9d5] hover:border-white/25"
											}`}
										>
											{preset >= 1000 ? `${preset / 1000}K` : preset}
										</button>
									))}
								</div>

								<input
									aria-label="Adjust eligible voter count"
									type="range"
									min="1"
									max="10000"
									step="25"
									value={Math.min(voters, 10000)}
									onChange={(event) => setVoters(Number(event.target.value))}
									className="mt-7 w-full accent-[#68d4c7]"
								/>

								<div className="mt-3 flex justify-between text-xs font-semibold text-[#9fb0c0]">
									<span>1</span>
									<span>10,000+</span>
								</div>

								<div className="mt-7 border-t border-white/10 pt-5">
									<div className="flex items-center justify-between text-sm text-[#bdc9d5]">
										<span>{voters.toLocaleString()} eligible voters × $1</span>
										<span className="font-bold text-white">
											${voters.toLocaleString()}
										</span>
									</div>
									<div className="mt-4 flex items-end justify-between gap-4">
										<p className="pb-1 text-xs font-bold uppercase tracking-[0.12em] text-[#9fb0c0]">
											Estimated total
										</p>
										<p className="text-5xl font-bold tabular-nums text-[#68d4c7]">
											${voters.toLocaleString()}
										</p>
									</div>
								</div>
							</div>

							<div className="mt-6 flex gap-3 rounded-xl border border-[#68d4c7]/20 bg-[#68d4c7]/8 p-4">
								<svg
									viewBox="0 0 24 24"
									className="h-5 w-5 shrink-0 text-[#68d4c7]"
									fill="none"
									stroke="currentColor"
									strokeWidth="1.8"
									aria-hidden="true"
								>
									<circle cx="12" cy="12" r="9" />
									<path d="M12 11v5M12 8h.01" />
								</svg>
								<p className="text-sm leading-6 text-[#d1dde7]">
									The estimate counts each unique eligible voter once, not ballots,
									visits, or repeated submissions.
								</p>
							</div>
						</aside>
					</div>
				</section>

				<section className="mx-auto max-w-[1180px] px-5 pb-16 sm:px-8 sm:pb-20">
					<div className="rounded-[24px] border border-[#10243f]/8 bg-white px-6 py-9 text-center sm:px-10">
						<h2 className="text-2xl font-bold tracking-tight text-[#10243f]">
							Ready to count every vote?
						</h2>
						<p className="mt-3 text-[#657487]">
							Set up your ballot and invite your eligible voters today.
						</p>
						<Link
							href="/register"
							className="mx-auto mt-6 flex h-12 w-fit items-center gap-2 rounded-lg bg-[#10243f] px-6 text-sm font-bold text-white"
						>
							Start an election <ArrowIcon />
						</Link>
					</div>
				</section>
			</main>

			<footer className="border-t border-[#10243f]/8 bg-white">
				<div className="mx-auto flex max-w-[1180px] flex-col gap-5 px-5 py-8 text-sm text-[#718093] sm:px-8 md:flex-row md:items-center md:justify-between">
					<div className="flex items-center gap-2.5">
						<BrandMark />
						<span className="font-bold text-[#10243f]">BallotVeyra</span>
					</div>
					<div className="flex gap-5">
						<Link
							href="/privacy"
							className="hover:text-[#10243f]"
						>
							Privacy
						</Link>
						<Link
							href="/terms"
							className="hover:text-[#10243f]"
						>
							Terms
						</Link>
						<Link
							href="/pricing"
							className="hover:text-[#10243f]"
						>
							Pricing
						</Link>
					</div>
				</div>
			</footer>
		</div>
	);
}
