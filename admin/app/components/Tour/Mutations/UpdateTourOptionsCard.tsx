import { Loader2, XCircleIcon } from "lucide-react";
import { useFieldArray, useFormContext, useWatch } from "react-hook-form";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "~/components/ui/accordion";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Switch } from "~/components/ui/switch";
import { Textarea } from "~/components/ui/textarea";
import type { AddTourInput, UpdateTourInput } from "@workspace/shared/schemas/tour.schema";
import { Label } from "~/components/ui/label";
import { Checkbox } from "~/components/ui/checkbox";
import { Fragment, useEffect, useState } from "react";
import DatePicker from "~/components/Custom-Inputs/date-picker";
import DateRangePicker from "~/components/Custom-Inputs/date-range-picker";
import { Separator } from "~/components/ui/separator";
import { startOfToday } from "date-fns";
import { IconChevronLeft, IconChevronRight, IconCurrencyDirham } from "@tabler/icons-react";
import { Badge } from "~/components/ui/badge";
import type { SeatType } from "@workspace/shared/types/tours";
import type { GetAllParticipantTypes } from "@workspace/shared/types/participant-types";
import { UpdateFormControlType } from "~/routes/Tours/update-tour";

export const TourOptionsCard = ({
	control,
	participants,
}: {
	control: UpdateFormControlType;
	participants: GetAllParticipantTypes;
}) => {
	const {
		getValues,
		formState: { errors },
	} = useFormContext<UpdateTourInput>();

	const { fields, append, remove } = useFieldArray({
		control,
		name: "tour_options",
	});

	const addNewOption = () => {
		const newOptionSortOrder =
			fields.length > 0 ? (Number(fields[fields.length - 1].sort_order) + 1).toString() : "1";

		append({
			id: undefined,
			name: "",
			inclusions: "",
			exclusions: "",
			note: "",
			sort_order: newOptionSortOrder,
			seat_type: "LIMITED",
			prices: [
				{
					id: undefined,
					price: "",
					participant: participants[0].id.toString(),
				},
			],
			availabilities: [],
			isOpenDated: "true",
		});
	};

	const n = useWatch({ control, name: "tour_options" });

	return (
		<Card>
			<CardHeader className="flex gap-4 place-items-center">
				<div className="h-fit">
					<Badge>{getValues("tour_options").length}</Badge>
				</div>

				<div className="grid gap-2">
					<CardTitle>Tour Options</CardTitle>
					<CardDescription>
						Available packages/options in this tour are listed here.
					</CardDescription>
				</div>
			</CardHeader>
			<Separator />
			<CardContent>
				<Fragment>
					<Accordion type="single" collapsible className="space-y-2">
						{errors.tour_options && (
							<div className="text-sm text-destructive">{errors.tour_options.message}</div>
						)}

						{fields.map((option, optionIndex) => (
							<Card key={option.id}>
								<AccordionItem value={`option-${optionIndex}`} key={option.id}>
									<CardHeader>
										<CardTitle>
											<AccordionTrigger className="flex justify-between text-base font-semibold py-0">
												Option {optionIndex + 1} : {n[optionIndex]?.name || "Unnamed"}
											</AccordionTrigger>
										</CardTitle>
									</CardHeader>
									<AccordionContent className="*:data-[slot=card-content]:space-y-4 mt-2">
										<CardContent className="pb-4">
											{/* Option Fields */}
											<FormField
												control={control}
												name={`tour_options.${optionIndex}.name`}
												render={({ field }) => (
													<FormItem>
														<FormLabel>Name</FormLabel>
														<FormControl>
															<Input
																placeholder="e.g. Tickets To Ferrari World"
																maxLength={300}
																{...field}
															/>
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>

											<FormField
												control={control}
												name={`tour_options.${optionIndex}.inclusions`}
												render={({ field }) => (
													<FormItem>
														<FormLabel>Inclusions</FormLabel>
														<FormControl>
															<Textarea
																placeholder="Inclusions of the option"
																{...field}
															/>
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>
											<FormField
												control={control}
												name={`tour_options.${optionIndex}.exclusions`}
												render={({ field }) => (
													<FormItem>
														<FormLabel>Exclusions</FormLabel>
														<FormControl>
															<Textarea
																placeholder="Exclusions of the option"
																{...field}
															/>
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>
											<FormField
												control={control}
												name={`tour_options.${optionIndex}.note`}
												render={({ field }) => (
													<FormItem>
														<FormLabel>Note</FormLabel>
														<FormControl>
															<Textarea
																placeholder="Special note or instructions (if any)"
																{...field}
															/>
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>
											<FormField
												control={control}
												name={`tour_options.${optionIndex}.sort_order`}
												render={({ field }) => (
													<FormItem>
														<FormLabel>Sort Order</FormLabel>
														<FormControl>
															<Input
																min={0}
																placeholder="Sort Order"
																type="number"
																{...field}
															/>
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>
											<FormField
												control={control}
												name={`tour_options.${optionIndex}.isOpenDated`}
												render={({ field }) => (
													<FormItem>
														<FormControl>
															<Label className="hover:bg-accent/50 flex items-start gap-3 rounded-lg border p-4 cursor-pointer">
																<Checkbox
																	checked={field.value === "true"}
																	onCheckedChange={() => {
																		field.onChange(
																			field.value === "true"
																				? "false"
																				: "true",
																		);
																	}}
																/>
																<div className="grid gap-1.5 font-normal">
																	<p className="text-sm leading-none font-medium">
																		Open Dated
																	</p>
																	<p className="text-muted-foreground text-sm">
																		This option will be marked as open
																		dated and available for any date for a
																		duration.
																	</p>
																</div>
															</Label>
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>
										</CardContent>

										<Separator className="my-5" />

										{/* Prices Subsection */}
										<CardContent>
											<PricesSubSection
												control={control}
												optionIndex={optionIndex}
												participants={participants}
											/>
										</CardContent>

										<Separator className="my-5" />

										{/* Availabilities Subsection */}
										<CardContent>
											<AvailabilitiesSubSection
												control={control}
												optionIndex={optionIndex}
											/>
										</CardContent>

										<CardContent className="mt-5 w-fit ml-auto">
											<Button
												type="button"
												size={"sm"}
												variant="destructive"
												onClick={() => remove(optionIndex)}
											>
												Remove Option
											</Button>
										</CardContent>
									</AccordionContent>
								</AccordionItem>
							</Card>
						))}
					</Accordion>
					<div className="w-fit ml-auto mt-4">
						<Button type="button" size={"sm"} onClick={addNewOption}>
							Add Option
						</Button>
					</div>
				</Fragment>
			</CardContent>
		</Card>
	);
};

// Prices SubSection Component
const PricesSubSection = ({
	control,
	optionIndex,
	participants,
}: {
	control: UpdateFormControlType;
	optionIndex: number;
	participants: GetAllParticipantTypes;
}) => {
	const { fields, append, remove } = useFieldArray({
		control,
		name: `tour_options.${optionIndex}.prices`,
		rules: {
			minLength: 1,
			required: true,
		},
	});

	const addPrice = () => {
		append({ id: undefined, price: "", participant: participants[0].id.toString() });
	};

	const gridCols =
		participants.length === 1
			? "lg:grid-cols-1"
			: participants.length === 2
				? "lg:grid-cols-2"
				: "lg:grid-cols-3";

	const formErrors = useFormContext<AddTourInput>().formState.errors;

	return (
		<div className="space-y-4">
			<Label className="font-bold text-lg">Prices</Label>
			{fields.length === 0 && <div className="text-sm text-muted-foreground">No prices found.</div>}
			{formErrors.tour_options?.[optionIndex]?.prices && (
				<div className="text-sm text-destructive">
					{formErrors.tour_options[optionIndex].prices.message}
				</div>
			)}
			<div className={`grid ${gridCols} pr-4 gap-4`}>
				{fields.map((price, priceIndex) => (
					<div
						key={price.id}
						className="flex flex-col space-y-4 bg-card shadow-md border-2 p-4 rounded-lg relative col-span-1"
					>
						<button
							className="absolute top-0 right-0 translate-x-1/2 -translate-y-1/2 cursor-pointer"
							type="button"
							onClick={() => remove(priceIndex)}
						>
							<XCircleIcon className="h-6 w-6 fill-destructive text-destructive-foreground" />
						</button>

						<FormField
							control={control}
							name={`tour_options.${optionIndex}.prices.${priceIndex}.price`}
							render={({ field }) => (
								<FormItem className="flex-1">
									<FormLabel>Price</FormLabel>
									<FormControl>
										<div className="flex gap-2 relative">
											<Input
												type="number"
												placeholder="e.g. 250"
												className="pl-10"
												step={0.1}
												min={0}
												{...field}
											/>
											<IconCurrencyDirham className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2" />
										</div>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={control}
							name={`tour_options.${optionIndex}.prices.${priceIndex}.participant`}
							render={({ field }) => (
								<FormItem className="flex-1">
									<FormLabel>Participant Type</FormLabel>
									<FormControl>
										<div>
											<Select value={field.value} onValueChange={field.onChange}>
												<SelectTrigger className="w-full">
													<SelectValue placeholder="Select participant" />
												</SelectTrigger>
												<SelectContent>
													{participants.map((pt) => (
														<SelectItem
															key={pt.id}
															value={pt.id.toString()}
															className="flex gap-2 items-center"
														>
															<div>{pt.name}</div>
															<div>
																{pt.age_max - pt.age_min > 50 ? (
																	<p>({pt.age_min}+)</p>
																) : (
																	<p>
																		({pt.age_min}-{pt.age_max})
																	</p>
																)}
															</div>
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</div>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>
				))}
			</div>
			<div className="ml-auto w-fit">
				<Button
					type="button"
					size={"sm"}
					onClick={addPrice}
					disabled={fields.length >= participants.length}
				>
					Add Price
				</Button>
			</div>
		</div>
	);
};

// Availabilities SubSection Component
const AvailabilitiesSubSection = ({
	control,
	optionIndex,
}: {
	control: UpdateFormControlType;
	optionIndex: number;
}) => {
	const { fields, append, remove } = useFieldArray({
		control,
		name: `tour_options.${optionIndex}.availabilities`,
	});

	const { setValue } = useFormContext();

	// Temporary state for new availability form (single or range)
	const [newTimeslots, setNewTimeslots] = useState<
		{
			time: string;
			label: string;
			sort_order: string;
			available_seats: string | null;
		}[]
	>([{ time: "", label: "", sort_order: "1", available_seats: "" }]);

	const [isRange, setIsRange] = useState(true);
	const [singleDate, setSingleDate] = useState("");
	const [range, setRange] = useState({ from: "", to: "" });
	const [cardCollapsed, setCardsCollapsed] = useState(false);
	const [addingAvailability, setAvailablitilyAdding] = useState(false);

	// Pagination state
	const [currentPage, setCurrentPage] = useState(1);
	const pageSize = 9;

	const optionSeatType = useWatch({ control, name: `tour_options.${optionIndex}.seat_type` }) as SeatType;

	const totalPages = Math.ceil(fields.length / pageSize);
	const startIndex = (currentPage - 1) * pageSize;
	const endIndex = startIndex + pageSize;
	const visibleAvailabilities = fields.slice(startIndex, endIndex);

	const addTimeslot = () => {
		const newTimeSlotSortOrder =
			newTimeslots.length > 0
				? (Number(newTimeslots[newTimeslots.length - 1].sort_order) + 1).toString()
				: "1";

		setNewTimeslots([
			...newTimeslots,
			{
				time: "",
				label: "",
				sort_order: newTimeSlotSortOrder,
				available_seats: optionSeatType === "UNLIMITED" ? null : "0",
			},
		]);
	};

	const updateTimeslot = (index: number, field: string, value: string) => {
		const updated = [...newTimeslots];
		updated[index][field as keyof (typeof updated)[0]] = value;
		setNewTimeslots(updated);
	};

	const removeTimeslot = (index: number) => {
		setNewTimeslots(newTimeslots.filter((_, i) => i !== index));
	};

	const handleAddAvailabilities = () => {
		setAvailablitilyAdding(true);
		const existingDates = fields.map((f) => f.date);

		const processedTimeslots = newTimeslots.map((ts) => ({
			id: undefined,
			time_slot_id: undefined,
			time: ts.time,
			label: ts.label || formatTimeLabel(ts.time),
			sort_order: ts.sort_order,
			available_seats: optionSeatType === "UNLIMITED" ? null : ts.available_seats || "0",
		}));

		if (isRange && range.from && range.to) {
			const start = new Date(range.from);
			const end = new Date(range.to);

			for (let d = start; d <= end; d.setDate(d.getDate() + 1)) {
				const dateStr = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
					.toISOString()
					.split("T")[0];

				if (!existingDates.includes(dateStr)) {
					append({ id: undefined, date: dateStr, isActive: "true", timeslots: processedTimeslots });
				}
			}
		} else if (!isRange && singleDate) {
			const singleDateStr = new Date(
				new Date(singleDate).getTime() - new Date(singleDate).getTimezoneOffset() * 60000,
			)
				.toISOString()
				.split("T")[0];
			if (!existingDates.includes(singleDateStr)) {
				append({
					id: undefined,
					date: singleDateStr,
					isActive: "true",
					timeslots: processedTimeslots,
				});
			}
		}

		setNewTimeslots([{ time: "", label: "", sort_order: "1", available_seats: "" }]);
		setSingleDate("");
		setRange({ from: "", to: "" });
		setAvailablitilyAdding(false);

		// Reset to first page after adding new items
		setCurrentPage(1);
	};

	useEffect(() => {
		if (optionSeatType === "UNLIMITED") {
			if (fields) {
				fields.forEach((avail: any, availIdx: number) => {
					if (avail.timeslots && avail.timeslots.length > 0) {
						avail.timeslots.forEach((_: any, tsIdx: number) => {
							setValue(
								`tour_options.${optionIndex}.availabilities.${availIdx}.timeslots.${tsIdx}.available_seats`,
								null,
								{ shouldValidate: true },
							);
						});
					}
				});
			}
		}
	}, [optionSeatType]);

	return (
		<div className="space-y-6">
			<div className="flex items-center gap-2 justify-between flex-wrap">
				<Label className="font-bold text-lg">Availabilities{` (${fields.length ?? 0})`}</Label>
				{fields.length > 0 && (
					<div className="flex gap-2 ml-auto">
						<div className="md:inline">
							<Button
								type="button"
								size="sm"
								variant="outline"
								onClick={() => setCardsCollapsed(!cardCollapsed)}
							>
								{cardCollapsed ? "Expand " : "Collapse "}All
							</Button>
						</div>
						<Button
							type="button"
							size="sm"
							variant="destructive"
							onClick={() => remove(fields.map((_, i) => i))}
						>
							Remove All
						</Button>
					</div>
				)}
			</div>

			{fields.length === 0 && (
				<div className="text-sm text-muted-foreground">No available dates added yet.</div>
			)}

			{/* Existing Availabilities - Paginated Card Grid */}
			<div className="grid grid-cols-1 min-[890px]:grid-cols-2 min-[1280px]:grid-cols-3 gap-4 mr-4">
				{visibleAvailabilities.map((avail, visibleIndex) => {
					const globalIndex = startIndex + visibleIndex;

					return (
						<div
							key={avail.id}
							className="flex flex-col bg-card shadow-md border-2 p-5 rounded-lg relative col-span-1 h-fit"
						>
							<button
								className="absolute top-0 right-0 translate-x-1/2 -translate-y-1/2 cursor-pointer"
								type="button"
								onClick={() => remove(globalIndex)}
							>
								<XCircleIcon className="h-6 w-6 fill-destructive text-destructive-foreground" />
							</button>

							<div className={!cardCollapsed ? "space-y-4" : ""}>
								{/* Date */}
								<FormField
									control={control}
									name={`tour_options.${optionIndex}.availabilities.${globalIndex}.date`}
									render={({ field }) => (
										<FormItem>
											<FormControl>
												<div className="w-full pointer-events-none">
													<DatePicker
														value={field.value ? new Date(field.value) : null}
														defaultMonth={
															field.value ? new Date(field.value) : new Date()
														}
														onDateChange={field.onChange}
														date_disabled={{ before: startOfToday() }}
														className={`${cardCollapsed ? "pointer-events-none disabled" : ""}`}
													/>
												</div>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<div hidden={cardCollapsed} className="space-y-4">
									{/* Active Switch */}
									<FormField
										control={control}
										name={`tour_options.${optionIndex}.availabilities.${globalIndex}.isActive`}
										render={({ field }) => (
											<FormItem className="flex items-center space-x-3">
												<FormLabel> Toggle Status</FormLabel>
												<FormControl>
													<Switch
														checked={field.value === "true"}
														onCheckedChange={(checked) =>
															field.onChange(checked ? "true" : "false")
														}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									{/* Timeslots for this date */}
									<TimeslotsSubSection
										control={control}
										optionIndex={optionIndex}
										availIndex={globalIndex}
									/>
								</div>
							</div>
						</div>
					);
				})}
			</div>

			{/* Pagination Controls */}
			{totalPages > 1 && (
				<div>
					<div className="flex justify-center items-center gap-4 mt-6">
						<Button
							variant="outline"
							size="sm"
							onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
							disabled={currentPage === 1}
							type="button"
						>
							<IconChevronLeft className="sm:hidden" />
							<span className="sm:inline hidden">Previous</span>
						</Button>
						<span className="text-sm text-muted-foreground">
							Page {currentPage} of {totalPages}
						</span>
						<Button
							variant="outline"
							size="sm"
							onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
							disabled={currentPage === totalPages}
							type="button"
						>
							<IconChevronRight className="sm:hidden" />
							<span className="sm:inline hidden">Next</span>
						</Button>
					</div>
					<div className="sm:flex hidden gap-2">
						<Label>Go To</Label>
						<Input
							type="number"
							onChange={(e) =>
								setCurrentPage(
									parseInt(e.target.value) > totalPages
										? totalPages
										: parseInt(e.target.value),
								)
							}
							className="w-16"
							max={totalPages}
							min={1}
							value={currentPage ?? 1}
						/>
					</div>
				</div>
			)}

			{/* ------------------------- */}
			{/* Add New Availability Card */}
			<Card>
				<CardHeader>
					<CardTitle className="text-base">Add New Availability</CardTitle>
				</CardHeader>
				<CardContent className="space-y-5">
					{/* Seats Type for this option */}
					<FormField
						control={control}
						name={`tour_options.${optionIndex}.seat_type`}
						render={({ field }) => (
							<FormItem className="flex items-center space-x-3">
								<FormControl>
									<Label className="cursor-pointer space-x-2">
										<Checkbox
											checked={field.value === "UNLIMITED"}
											onCheckedChange={(checked) => {
												field.onChange(checked ? "UNLIMITED" : "LIMITED");
											}}
										/>
										<span>Unlimited Seats/Tickets for this tour option</span>
									</Label>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					{/* Range Toggle */}
					<Label className="cursor-pointer space-x-2">
						<Checkbox checked={isRange} onCheckedChange={() => setIsRange(!isRange)} />
						<span>Use Date Range</span>
					</Label>

					{/* Date Picker */}
					{isRange ? (
						<div>
							{[
								{ class: "picker-xl", months: 4 },
								{ class: "picker-lg", months: 3 },
								{ class: "picker-md", months: 2 },
								{ class: "picker-sm", months: 1 },
							].map((p) => (
								<DateRangePicker
									value={{
										from: range.from ? new Date(range.from) : undefined,
										to: range.to ? new Date(range.to) : undefined,
									}}
									onDateRangeChange={(r) =>
										setRange({
											from: r?.from ? r.from.toISOString() : "",
											to: r?.to ? r.to.toISOString() : "",
										})
									}
									date_disabled={{ before: startOfToday() }}
									numberOfMonths={p.months}
									className={`picker ${p.class}`}
									key={p.months}
								/>
							))}
						</div>
					) : (
						<DatePicker
							value={singleDate ? new Date(singleDate) : undefined}
							defaultMonth={singleDate ? new Date(singleDate) : new Date()}
							onDateChange={(date) => setSingleDate(date ? date.toISOString() : "")}
							date_disabled={{ before: startOfToday() }}
						/>
					)}

					{/* Timeslots Input */}
					<div className="space-y-3">
						<Label className="text-base">Timeslots</Label>
						{newTimeslots.length === 0 && (
							<div className="text-sm text-destructive">
								No timeslots found. Please add atleast one timeslot.
							</div>
						)}
						<div className="space-y-2">
							{newTimeslots.map((ts, tsIndex) => (
								<div key={tsIndex} className="*:flex *:gap-2 space-y-2">
									<div>
										<Input
											type="time"
											step="1"
											placeholder="Time"
											className="appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
											value={ts.time}
											onChange={(e) => {
												updateTimeslot(tsIndex, "time", e.target.value);
												const formatted = formatTimeLabel(e.target.value);
												updateTimeslot(tsIndex, "label", formatted);
											}}
										/>
										<Input
											placeholder="Label"
											value={ts.label}
											onChange={(e) => updateTimeslot(tsIndex, "label", e.target.value)}
										/>
									</div>
									<div>
										<Input
											type="number"
											placeholder="Sort Order"
											min={0}
											value={ts.sort_order}
											onChange={(e) =>
												updateTimeslot(tsIndex, "sort_order", e.target.value)
											}
										/>
										{optionSeatType !== "UNLIMITED" && (
											<Input
												type="number"
												placeholder="Seats"
												min={0}
												value={ts.available_seats ?? ""}
												onChange={(e) =>
													updateTimeslot(tsIndex, "available_seats", e.target.value)
												}
											/>
										)}
									</div>
									<div className="ml-auto w-fit">
										<Button
											type="button"
											variant="destructive"
											size="sm"
											onClick={() => removeTimeslot(tsIndex)}
										>
											Remove Timeslot
										</Button>
									</div>
								</div>
							))}
						</div>
						{optionSeatType === "LIMITED" &&
							newTimeslots.some(
								(ts) => !ts.available_seats || Number(ts.available_seats) <= 0,
							) && (
								<div className="text-sm text-muted-foreground">
									All timeslots must have at least 1 seat when Limited is selected.
								</div>
							)}
						<div className="w-fit ml-auto mt-4">
							<Button type="button" variant="outline" size="sm" onClick={addTimeslot}>
								Add Timeslot
							</Button>
						</div>
					</div>
				</CardContent>
				<Separator />
				<CardContent>
					{/* Submit Add */}
					<div className="w-fit">
						<Button
							type="button"
							size="sm"
							onClick={handleAddAvailabilities}
							disabled={
								addingAvailability ||
								(!isRange && !singleDate) ||
								(isRange && (!range.from || !range.to)) ||
								newTimeslots.length === 0 ||
								newTimeslots.every((ts) => !ts.time) ||
								(optionSeatType == "LIMITED" &&
									newTimeslots.every(
										(ts) => !ts.available_seats == null || ts.available_seats == "",
									))
							}
						>
							{addingAvailability && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
							Add{addingAvailability && "ing"} {isRange ? "Availabilities" : "Availability"}
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	);
};

const formatTimeLabel = (time: string) => {
	if (!time) return "";

	try {
		const [hours, minutes] = time.split(":");
		let hour = parseInt(hours, 10);
		const period = hour >= 12 ? "PM" : "AM";
		if (hour === 0) hour = 12;
		if (hour > 12) hour -= 12;
		return `${hour}:${minutes} ${period}`;
	} catch {
		return time;
	}
};

// Timeslots SubSection for existing availability
const TimeslotsSubSection = ({
	control,
	optionIndex,
	availIndex,
}: {
	control: UpdateFormControlType;
	optionIndex: number;
	availIndex: number;
}) => {
	const { fields, append, remove } = useFieldArray({
		control,
		name: `tour_options.${optionIndex}.availabilities.${availIndex}.timeslots`,
	});

	const { setValue } = useFormContext();
	const optionSeatType = useWatch({ control, name: `tour_options.${optionIndex}.seat_type` }) as SeatType;

	const addTimeslot = () => {
		const newSlotSortOrder =
			fields.length > 0 ? (Number(fields[fields.length - 1].sort_order) + 1).toString() : "1";

		append({
			id: undefined,
			time_slot_id: undefined,
			time: "",
			label: "",
			sort_order: newSlotSortOrder,
			available_seats: optionSeatType === "UNLIMITED" ? null : "0",
		});
	};

	return (
		<div className="space-y-4">
			<div className="space-y-2">
				<Label className="text-base">Timeslots</Label>
				{fields.length === 0 && (
					<div className="text-sm text-destructive">
						No timeslots found. Please add atleast one timeslot.
					</div>
				)}
				<div className="space-y-4">
					{fields.map((ts, tsIndex) => {
						const currentTime = control._getWatch(
							`tour_options.${optionIndex}.availabilities.${availIndex}.timeslots.${tsIndex}.time`,
						) as string;

						return (
							<div key={ts.id} className="*:flex *:gap-2 space-y-2">
								<p className="text-xs text-muted-foreground">
									#{ts.time_slot_id != undefined ? ts.time_slot_id : "NEW"}
								</p>
								<div>
									<FormField
										control={control}
										name={`tour_options.${optionIndex}.availabilities.${availIndex}.timeslots.${tsIndex}.time`}
										render={({ field }) => (
											<FormItem
												className={`flex-1 ${ts.time_slot_id !== undefined && "disabled cursor-not-allowed"}`}
											>
												<FormControl>
													<Input
														type="time"
														step="1"
														placeholder="Time (HH:MM:SS)"
														className="appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none  select-none"
														{...field}
														onChange={(e) => {
															field.onChange(e);
															const formatted = formatTimeLabel(e.target.value);
															setValue(
																`tour_options.${optionIndex}.availabilities.${availIndex}.timeslots.${tsIndex}.label`,
																formatted,
																{ shouldValidate: true },
															);
														}}
														disabled={ts.time_slot_id !== undefined}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									<FormField
										control={control}
										name={`tour_options.${optionIndex}.availabilities.${availIndex}.timeslots.${tsIndex}.label`}
										render={({ field }) => (
											<FormItem className="flex-1">
												<FormControl>
													<Input
														placeholder="Label"
														{...field}
														value={
															field.value || formatTimeLabel(currentTime || "")
														}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>
								<div>
									<FormField
										control={control}
										name={`tour_options.${optionIndex}.availabilities.${availIndex}.timeslots.${tsIndex}.sort_order`}
										render={({ field }) => (
											<FormItem
												className={`flex-1 ${ts.time_slot_id !== undefined && "disabled cursor-not-allowed"}`}
											>
												<FormControl>
													<Input
														type="number"
														min={0}
														placeholder="Sort Order"
														disabled={ts.time_slot_id !== undefined}
														{...field}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>

									{optionSeatType !== "UNLIMITED" && (
										<FormField
											control={control}
											name={`tour_options.${optionIndex}.availabilities.${availIndex}.timeslots.${tsIndex}.available_seats`}
											render={({ field }) => (
												<FormItem className="flex-1">
													<FormControl>
														<Input
															type="number"
															placeholder="Seats"
															min={0}
															{...field}
															value={field.value ?? ""}
														/>
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
									)}
								</div>
								<Button
									type="button"
									variant="destructive"
									size={"sm"}
									onClick={() => remove(tsIndex)}
									className="ml-auto"
									hidden={ts.time_slot_id !== undefined}
								>
									Remove Timeslot
								</Button>
							</div>
						);
					})}
				</div>
			</div>
			<div className="w-fit ml-auto mt-4">
				<Button
					type="button"
					size={"sm"}
					variant={"outline"}
					className="ml-auto"
					onClick={addTimeslot}
				>
					Add Timeslot
				</Button>
			</div>
		</div>
	);
};
