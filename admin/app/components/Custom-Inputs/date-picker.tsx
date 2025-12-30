import { Button } from "~/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover";
import { Calendar } from "~/components/Custom-Inputs/calendar";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useState } from "react";
import { cn } from "@workspace/shared/utils/ui";
import type { Matcher } from "react-day-picker";

type DatePickerProps = {
	className?: string;
	value?: Date | null;
	onDateChange?: (date: Date | undefined) => void;
	displayFormat?: string;
	date_disabled?: Matcher | Matcher[];
};

export default function DatePicker({
	className,
	value: controlledValue,
	onDateChange: controlledOnChange,
	displayFormat = "PPP",
	date_disabled,
	...rest
}: DatePickerProps) {
	const isControlled = controlledOnChange != null;
	const [internalState, setInternalState] = useState<Date | undefined>(new Date());

	const date = isControlled ? (controlledValue ?? undefined) : internalState;

	function handleSelect(selectedDate: Date | undefined) {
		if (isControlled) {
			controlledOnChange!(selectedDate);
		} else {
			setInternalState(selectedDate);
		}
	}

	return (
		<div {...rest} className={cn("w-full", className)}>
			<Popover>
				<PopoverTrigger asChild>
					<Button
						id="single-date-picker"
						variant="outline"
						className={cn(
							"w-full justify-start text-left font-normal",
							!date && "text-muted-foreground",
						)}
						noEffect={true}
					>
						<CalendarIcon className="mr-2 h-4 w-4" />
						{date ? format(date, displayFormat) : <span>Pick a date</span>}
					</Button>
				</PopoverTrigger>
				<PopoverContent className="w-auto p-0" align="start">
					<Calendar
						mode="single"
						selected={date}
						onSelect={handleSelect}
						disabled={date_disabled}
						autoFocus
					/>
				</PopoverContent>
			</Popover>
		</div>
	);
}
