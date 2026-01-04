import { Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { type AddFormControlType } from "~/routes/Tours/add-tour";

type Props = {
	control: AddFormControlType;
	cities: { id: number; name: string }[];
	categories: { id: number; name: string }[];
	providers: { id: number; name: string }[];
};

export const GeneralDetailsCard = ({ control, cities, categories, providers }: Props) => {
	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-lg">General</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				{/* Tour Name */}
				<FormField
					control={control}
					name="name"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Tour Name</FormLabel>
							<FormControl>
								<Input
									placeholder="e.g. Ferrari World, Abu Dhabi"
									spellCheck={false}
									{...field}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				{/* City */}
				<FormField
					control={control}
					name="city_id"
					render={({ field }) => (
						<FormItem>
							<FormLabel>City</FormLabel>
							<FormControl>
								<div className="*:w-full">
									<Select onValueChange={field.onChange} value={field.value}>
										<SelectTrigger>
											<SelectValue placeholder="Select City" />
										</SelectTrigger>
										<SelectContent>
											{cities.map((c) => (
												<SelectItem key={c.id} value={c.id.toString()}>
													{c.name}
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

				{/* Category */}
				<FormField
					control={control}
					name="tour_category_id"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Category</FormLabel>
							<FormControl>
								<div className="*:w-full">
									<Select onValueChange={field.onChange} value={field.value}>
										<SelectTrigger>
											<SelectValue placeholder="Select Category" />
										</SelectTrigger>
										<SelectContent>
											{categories.map((c) => (
												<SelectItem key={c.id} value={c.id.toString()}>
													{c.name}
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

				{/* Tour Provider */}
				<FormField
					control={control}
					name="provider"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Tour Provider</FormLabel>
							<FormControl>
								<div className="*:w-full flex-1">
									<Select onValueChange={field.onChange} value={field.value}>
										<SelectTrigger>
											<SelectValue placeholder="Select Tour Provider" />
										</SelectTrigger>
										<SelectContent>
											{providers.map((c) => (
												<SelectItem key={c.id} value={c.id.toString()}>
													{c.name}
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

				{/* Duration */}
				<FormField
					control={control}
					name="duration_minutes"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Duration</FormLabel>
							<FormControl>
								<div className="flex gap-2 relative">
									<Input
										type="number"
										min={1}
										minLength={1}
										step={0.1}
										className="pl-10"
										placeholder="e.g. Duration in hours"
										{...field}
									/>
									<Clock className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2" />
								</div>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
			</CardContent>
		</Card>
	);
};
