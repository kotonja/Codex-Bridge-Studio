local FormatNumbers = {}

function FormatNumbers.Compact(value)
	local numberValue = tonumber(value) or 0
	local absValue = math.abs(numberValue)
	if absValue >= 1000000000 then
		return string.format("%.1fB", numberValue / 1000000000)
	elseif absValue >= 1000000 then
		return string.format("%.1fM", numberValue / 1000000)
	elseif absValue >= 1000 then
		return string.format("%.1fK", numberValue / 1000)
	end
	return tostring(math.floor(numberValue + 0.5))
end

return FormatNumbers
