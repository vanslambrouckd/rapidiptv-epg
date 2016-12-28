(function () {
    function Item() {
        this.attributes = [];
    }

    Item.prototype.printNaam = function () {
        return 'mijn naam is '+this.naam;
    }

    Item.prototype.get = function(attr_name) {
        if (this.attributes[attr_name]) {
            return this.attributes[attr_name];
        }

        return null;
    }

    Item.prototype.set = function(attr_name, attr_value) {
        this.attributes[attr_name] = attr_value;
    }

   module.exports = Item; 
}());