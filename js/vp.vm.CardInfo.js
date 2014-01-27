function CardInfo(data) {
	var self = this;

	this.CardValue = data.CardValue;
	this.Description = data.Description;
	this.NumericValue = data.NumericValue;
	this.ValueName = data.ValueName;
	this.ShortName = data.ShortName;
	this.ResFile = data.ResFile;
	this.MarkedForDiscard = false;
}
