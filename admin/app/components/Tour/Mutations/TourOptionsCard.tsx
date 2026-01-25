import { XCircleIcon } from "lucide-react";
import { useFieldArray, useFormContext, useWatch } from "react-hook-form";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "~/components/ui/accordion";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Textarea } from "~/components/ui/textarea";
import type { AddTourInput } from "@workspace/shared/schemas/tour.schema";
import { Label } from "~/components/ui/label";
import { Checkbox } from "~/components/ui/checkbox";
import { Fragment, useState } from "react";
import DatePicker from "~/components/Custom-Inputs/date-picker";
import DateRangePicker from "~/components/Custom-Inputs/date-range-picker";
import { Separator } from "~/components/ui/separator";
import { format, startOfToday } from "date-fns";
import { IconCurrencyDirham } from "@tabler/icons-react";
import { Badge } from "~/components/ui/badge";
import { type AddFormControlType } from "~/routes/Tours/add-tour";
import type { GetAllParticipantTypes } from "@workspace/shared/types/participant-types";
import { toast } from "sonner";
import type { AvailabilityOverrideType } from "@workspace/shared/types/tours";

export const TourOptionsCard = ({
	control,
	participants,
}: {
	control: AddFormControlType;
	participants: GetAllParticipantTypes;
}) => {
	const {
		getValues,
		formState: { errors },
	} = useFormContext<AddTourInput>();

	const { fields, append, remove } = useFieldArray({
		control,
		name: "tour_options",
	});

	const addNewOption = () => {
		const newOptionSortOrder =
			fields.length > 0 ? (Number(fields[fields.length - 1].sort_order) + 1).toString() : "1";

		append({
			name: "",
			inclusions: "",
			exclusions: "",
			note: "",
			sort_order: newOptionSortOrder,
			prices: [
				{
					price: "",
					participant: participants[0].id.toString(),
				},
			],
			rules: [],
			overrides: [],
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
											<AvailabilitySettingsSubSection
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
	control: AddFormControlType;
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
		append({ price: "", participant: participants[0].id.toString() });
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
									<FormLabel>Participant</FormLabel>
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
																{pt.age_max - pt.age_min > 80 ? (
																	<p>({pt.age_min}+)</p>
																) : pt.age_max === 0 && pt.age_min === 0 ? (
																	<></>
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
const AvailabilitySettingsSubSection = ({
	control,
	optionIndex,
}: {
	control: AddFormControlType;
	optionIndex: number;
}) => {
	// Rules field array
	const {
		fields: ruleFields,
		append: appendRule,
		remove: removeRule,
	} = useFieldArray({
		control,
		name: `tour_options.${optionIndex}.rules`,
	});

	// Overrides field array
	const {
		fields: overrideFields,
		append: appendOverride,
		remove: removeOverride,
	} = useFieldArray({
		control,
		name: `tour_options.${optionIndex}.overrides`,
	});

	// Temp state for new rule form
	const [newRule, setNewRule] = useState({
		start_date: "",
		end_date: "",
		weekdays: ["1", "2", "3", "4", "5", "6", "7"] as string[],
		is_active: true,
		time_slots: [{ time: "", label: "", capacity: "20", is_active: true }],
	});

	// Temp state for new override
	const [newOverride, setNewOverride] = useState({
		date: "",
		override_type: "CLOSE" as AvailabilityOverrideType,
		new_capacity: "",
		time_slot_label: "Whole Day" as string | null,
	});

	const addTimeSlotToNewRule = () => {
		setNewRule((prev) => ({
			...prev,
			time_slots: [...prev.time_slots, { time: "", label: "", capacity: "10", is_active: true }],
		}));
	};

	const updateNewRuleTimeSlot = (idx: number, field: keyof (typeof newRule.time_slots)[0], value: any) => {
		setNewRule((prev) => {
			const slots = [...prev.time_slots];
			slots[idx] = { ...slots[idx], [field]: value };
			if (field === "time") {
				slots[idx].label = formatTimeLabel(value);
			}
			return { ...prev, time_slots: slots };
		});
	};

	const removeNewRuleTimeSlot = (idx: number) => {
		setNewRule((prev) => ({
			...prev,
			time_slots: prev.time_slots.filter((_, i) => i !== idx),
		}));
	};

	const handleAddRule = () => {
		let temp: string[] = [];
		let breakProcess = false;

		newRule.time_slots.forEach((ts) => {
			if (temp.includes(ts.label)) {
				breakProcess = true;
				return;
			}
			temp.push(ts.label);
		});

		if (breakProcess) {
			toast.error("Time slot label must be unique");
			return;
		}

		appendRule({
			start_date: newRule.start_date,
			end_date: newRule.end_date,
			weekdays: newRule.weekdays as ("1" | "2" | "3" | "4" | "5" | "6" | "7")[],
			is_active: newRule.is_active ? "true" : "false",
			time_slots: newRule.time_slots.map((ts) => ({
				label: ts.label,
				capacity: ts.capacity,
				is_active: ts.is_active ? "true" : "false",
			})),
		});

		setNewRule({
			start_date: "",
			end_date: "",
			weekdays: [],
			is_active: true,
			time_slots: [{ time: "", label: "", capacity: "10", is_active: true }],
		});
	};

	const handleAddOverride = () => {
		appendOverride({
			date: newOverride.date,
			override_type: newOverride.override_type,
			new_capacity:
				newOverride.override_type === "CAPACITY_CHANGE" ? newOverride.new_capacity.toString() : null,
			time_slot_label: newOverride.time_slot_label === "Whole Day" ? null : newOverride.time_slot_label,
		});

		setNewOverride({
			date: "",
			override_type: "CLOSE",
			new_capacity: "",
			time_slot_label: "Whole Day",
		});
	};

	const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

	return (
		<div className="space-y-8">
			{/* Rules Section */}
			<div className="space-y-5">
				<div className="flex items-center justify-between">
					<Label className="text-lg font-semibold">Availability Rules ({ruleFields.length})</Label>
					{ruleFields.length > 0 && (
						<div>
							<Button
								variant="destructive"
								size="sm"
								onClick={() => removeRule(ruleFields.map((_, i) => i))}
							>
								Clear All Rules
							</Button>
						</div>
					)}
				</div>

				{ruleFields.length === 0 && (
					<p className="text-sm text-muted-foreground">No recurring rules added yet.</p>
				)}

				<div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
					{ruleFields.map((rule, idx) => (
						<div key={rule.id} className="relative">
							<Card className="border-2 overflow-hidden">
								<button
									type="button"
									className="absolute top-0 right-0 translate-x-1/2 -translate-y-1/2 cursor-pointer"
									onClick={() => removeRule(idx)}
								>
									<XCircleIcon className="h-6 w-6 fill-destructive text-destructive-foreground" />
								</button>

								<CardHeader>
									<div className="flex items-center justify-between">
										<CardTitle className="text-base">Rule {idx + 1}</CardTitle>
										{rule.is_active === "true" ? (
											<Badge>Active</Badge>
										) : (
											<Badge variant={"destructive"}>Disabled</Badge>
										)}
									</div>
								</CardHeader>

								<Separator />

								<CardContent className="space-y-4 text-sm">
									<div className="flex gap-3 items-center">
										<span className="font-medium">Period</span>
										<span>
											{rule.start_date.split("T")[0].replace(/-/g, "/")} →{" "}
											{rule.end_date.split("T")[0].replace(/-/g, "/")}
										</span>
									</div>

									<div>
										<span className="font-medium mb-1">Weekdays</span>
										<div className="mt-2 flex flex-wrap gap-1">
											{rule.weekdays
												.sort((a, b) => Number(a) - Number(b))
												.map((d: string) => (
													<Badge key={d} variant="secondary">
														{days[Number(d) - 1]}
													</Badge>
												))}
										</div>
									</div>

									<div>
										<span className="font-medium">Time Slots</span>
										<div className="mt-2 space-y-2">
											{(rule.time_slots || []).map((ts: any, tsi: number) => (
												<div
													key={tsi}
													className="flex items-center gap-3 text-xs bg-muted/40 border rounded-md p-2"
												>
													<span className="font-medium">{ts.label}</span>
													<span className="text-muted-foreground">
														• {ts.capacity} seats
													</span>
													{ts.is_active === "true" ? (
														<div className="ml-auto rounded-full p-1 bg-primary" />
													) : (
														<div className="ml-auto rounded-full p-1 bg-destructive" />
													)}
												</div>
											))}
										</div>
									</div>
								</CardContent>
							</Card>
						</div>
					))}
				</div>

				{/* Add new rule form */}
				<Card className="border-dashed">
					<CardHeader className="">
						<CardTitle className="text-base">Add New Rule</CardTitle>
					</CardHeader>
					<CardContent className="space-y-6">
						<div className="flex gap-3">
							<Label>Activate the rule?</Label>
							<Checkbox
								checked={newRule.is_active}
								onCheckedChange={(checked) =>
									setNewRule((p) => ({ ...p, is_active: checked ? true : false }))
								}
							/>
						</div>
						{/* Date range */}
						<div className="space-y-3">
							<Label>Applicable Date</Label>
							<div>
								{[
									{ class: "picker-xl", months: 4 },
									{ class: "picker-lg", months: 3 },
									{ class: "picker-md", months: 2 },
									{ class: "picker-sm", months: 1 },
								].map((p) => (
									<DateRangePicker
										value={{
											from: newRule.start_date
												? new Date(newRule.start_date)
												: undefined,
											to: newRule.end_date ? new Date(newRule.end_date) : undefined,
										}}
										onDateRangeChange={(range) =>
											setNewRule((p) => ({
												...p,
												start_date: range?.from
													? format(range.from, "yyyy-MM-dd")
													: "",
												end_date: range?.to ? format(range.to, "yyyy-MM-dd") : "",
											}))
										}
										date_disabled={{ before: startOfToday() }}
										numberOfMonths={p.months}
										className={`picker ${p.class}`}
										key={p.months}
									/>
								))}
							</div>
						</div>

						{/* Weekdays */}
						<div className="space-y-3">
							<FormLabel>Applies on these days in any week</FormLabel>
							<div className="flex flex-wrap gap-3">
								{days.map((day, i) => (
									<Label key={day} className="flex items-center gap-2 cursor-pointer">
										<Checkbox
											checked={newRule.weekdays.includes((i + 1).toString())}
											onCheckedChange={(checked) =>
												setNewRule((p) => ({
													...p,
													weekdays: checked
														? [...p.weekdays, (i + 1).toString()]
														: p.weekdays.filter((d) => d !== (i + 1).toString()),
												}))
											}
										/>
										{day}
									</Label>
								))}
							</div>
						</div>

						{/* Time slots */}
						<div className="space-y-4">
							<div className="flex items-center justify-between">
								<FormLabel>Time Slots</FormLabel>
								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={addTimeSlotToNewRule}
								>
									Add Slot
								</Button>
							</div>

							{newRule.time_slots.length === 0 && (
								<div>
									<p className="text-sm text-muted-foreground">
										Please add at least one time slot
									</p>
								</div>
							)}

							{newRule.time_slots.map((ts, tsi) => (
								<div
									key={tsi}
									className="grid grid-cols-1 sm:grid-cols-[0.1fr_1fr_1fr_1fr_1fr] gap-3 items-end [&>.newTsFields]:space-y-1"
								>
									<div>
										<Checkbox
											checked={ts.is_active}
											onCheckedChange={(v) =>
												updateNewRuleTimeSlot(tsi, "is_active", v)
											}
											className="my-auto mb-2 w-4 h-4"
										/>
									</div>

									<div className="newTsFields">
										<FormLabel className="text-xs">Time</FormLabel>
										<Input
											type="time"
											step="300"
											value={ts.time}
											onChange={(e) =>
												updateNewRuleTimeSlot(tsi, "time", e.target.value)
											}
											placeholder="Time (HH:MM)"
											className="appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none  select-none"
										/>
									</div>

									<div className="newTsFields">
										<FormLabel className="text-xs">Label</FormLabel>
										<Input
											value={ts.label}
											placeholder="e.g. 10:00 AM"
											onChange={(e) =>
												updateNewRuleTimeSlot(tsi, "label", e.target.value)
											}
										/>
									</div>

									<div className="newTsFields">
										<FormLabel className="text-xs">Capacity</FormLabel>
										<Input
											type="number"
											min={0}
											value={ts.capacity}
											placeholder="Base Capacity"
											onChange={(e) =>
												updateNewRuleTimeSlot(tsi, "capacity", e.target.value)
											}
										/>
									</div>

									<div className="flex items-center gap-3 ml-auto">
										<Button
											variant="destructive"
											size="icon"
											className="h-8 w-8"
											type="button"
											onClick={() => removeNewRuleTimeSlot(tsi)}
										>
											<XCircleIcon className="h-4 w-4" />
										</Button>
									</div>
								</div>
							))}
						</div>

						<div className="w-fit mt-6">
							<Button
								type="button"
								className="w-full sm:w-auto"
								onClick={handleAddRule}
								disabled={
									!newRule.start_date ||
									!newRule.end_date ||
									newRule.weekdays.length === 0 ||
									newRule.time_slots.some((ts) => !ts.label || Number(ts.capacity) < 0)
								}
								size={"sm"}
							>
								Add Rule
							</Button>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Overrides Section */}
			<div className="space-y-5 mt-6">
				<div className="flex items-center justify-between">
					<Label className="text-lg font-semibold">
						Overrides & Exceptions ({overrideFields.length})
					</Label>
					{overrideFields.length > 0 && (
						<div>
							<Button
								type="button"
								variant="destructive"
								size="sm"
								onClick={() => removeOverride(overrideFields.map((_, i) => i))}
							>
								Clear All Overrides
							</Button>
						</div>
					)}
				</div>

				{overrideFields.length === 0 && (
					<p className="text-sm text-muted-foreground">No exceptions/overrides added yet.</p>
				)}

				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
					{overrideFields.map((ov, idx) => (
						<div key={ov.id} className="relative">
							<Card className="border-2">
								<button
									type="button"
									className="absolute top-0 right-0 translate-x-1/2 -translate-y-1/2 cursor-pointer"
									onClick={() => removeOverride(idx)}
								>
									<XCircleIcon className="h-6 w-6 fill-destructive text-destructive-foreground" />
								</button>
								<CardContent className="pt-1 space-y-3 text-sm">
									<div className="font-medium">
										{ov.date.split("T")[0].replace(/-/g, "/")}
									</div>
									<div className="flex items-center gap-2">
										<Badge
											variant={ov.override_type !== "CLOSE" ? "outline" : "secondary"}
										>
											{ov.override_type.toUpperCase().replace("_", " ")}
										</Badge>
										{ov.override_type === "CAPACITY_CHANGE" && (
											<span className="text-muted-foreground">
												→ {ov.new_capacity} seats
											</span>
										)}
									</div>
									<div className="text-muted-foreground">
										{ov.time_slot_label ? `Timeslot: ${ov.time_slot_label}` : "Whole day"}
									</div>
								</CardContent>
							</Card>
						</div>
					))}
				</div>

				{/* Add new override form */}
				<Card className="border-dashed">
					<CardHeader>
						<CardTitle className="text-base">Add New Override</CardTitle>
					</CardHeader>
					<CardContent className="space-y-6">
						<div className="space-y-2">
							<FormLabel>Date</FormLabel>
							<DatePicker
								value={newOverride.date ? new Date(newOverride.date) : undefined}
								onDateChange={(d) =>
									setNewOverride((p) => ({
										...p,
										date: d ? format(d, "yyyy-MM-dd") : "",
									}))
								}
								date_disabled={{ before: startOfToday() }}
							/>
						</div>

						<div className="space-y-2">
							<FormLabel>Type</FormLabel>
							<Select
								value={newOverride.override_type}
								onValueChange={(v) =>
									setNewOverride((p) => ({ ...p, override_type: v as any }))
								}
							>
								<SelectTrigger className="w-full">
									<SelectValue placeholder="Select override type" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="CLOSE">Close</SelectItem>
									<SelectItem value="CAPACITY_CHANGE">Change Capacity</SelectItem>
								</SelectContent>
							</Select>
						</div>

						{newOverride.override_type === "CAPACITY_CHANGE" && (
							<div className="space-y-2">
								<FormLabel>New Capacity</FormLabel>
								<Input
									type="number"
									min={0}
									placeholder="New Capacity"
									value={newOverride.new_capacity}
									onChange={(e) =>
										setNewOverride((p) => ({ ...p, new_capacity: e.target.value }))
									}
								/>
							</div>
						)}

						<div className="space-y-2">
							<FormLabel>Affect</FormLabel>
							<div className="text-sm text-muted-foreground font-medium">
								Whole Day (all time slots on selected date)
							</div>
							{/* Hidden field to keep schema happy */}
							<input type="hidden" value="Whole Day" />
							{/* Select for timeslots or full day */}
							{/* <Select
								value={newOverride.time_slot_label ?? "Whole Day"}
								onValueChange={(v) =>
									setNewOverride((p) => ({
										...p,
										time_slot_label: v === "Whole Day" ? null : v,
									}))
								}
							>
								<SelectTrigger className="w-full">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="Whole Day">Whole Day</SelectItem>
									{uniqueLabels.map((lbl) => (
										<SelectItem key={lbl} value={lbl}>
											{lbl}
										</SelectItem>
									))}
								</SelectContent>
							</Select> */}
						</div>

						<div className="w-fit mt-6">
							<Button
								type="button"
								className="w-full sm:w-auto"
								onClick={handleAddOverride}
								disabled={
									!newOverride.date ||
									(newOverride.override_type === "CAPACITY_CHANGE" &&
										(!newOverride.new_capacity || Number(newOverride.new_capacity) < 0))
								}
								size={"sm"}
							>
								Add Override
							</Button>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
};

// Helper
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
