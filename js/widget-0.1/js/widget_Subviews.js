clear();

function Widget() {
    this._subviewsByIndex = [];
    this._subviewsByName = {};
    
}

Widget.prototype.addSubview = function(key, value) {
    if (arguments.length == 1) {
        this._subviewsByIndex.push(value);
        
    } else if (arguments.length == 2){
        if ( this._subviewsByName.hasOwnProperty(key) ) {
            console.log('Subview already defined');
            return false;
            
        }
        this._subviewsByIndex.push(value);
        this._subviewsByName[key] = value;
        return true;
        
    } else {
        console.log('Usage: \n addSubview[key, value] \n addSubview[value] ');
        return false;
        
    }
    
}

Widget.prototype.getSubview = function(identifier) {
    if (arguments.length == 1) {
        if (typeof identifier == 'number'){
            if (this._subviewsByIndex.length >= identifier && identifier > 0) {
                return this._subviewsByIndex[identifier - 1];
                
            } else {
                console.log("Array index out of bounds: ", identifier);
                return false;
                
            }
        } else if (typeof identifier == 'string') {
            if ( this._subviewsByName.hasOwnProperty(identifier) ) {
                return this._subviewsByName[identifier];
                
            } else {
                console.log('Subview not defined');
                return false;
            }
        } else {
            console.log('Usage: \n getSubview[key] "string" \n getSubview[index] "number"');
            return false;
        }
    
    } else {
        console.log('Usage: \n getSubview[key] "string" \n getSubview[index], "number" > 0');
        return false;
        
    }
}

Widget.prototype.hasSubview = function(identifier){
    //this.getSubview(identifier);
    if (this.getSubview(identifier)) {
        return true;
    }
    return false;
}

Widget.prototype.removeSubview = function(identifier){
    if ( this.hasSubview(identifier) ){
        ////// TODO 
    }
}

var atable = new Widget();
atable.addSubview("as",{ objProp: 'prop' });
atable.removeSubview("asa")

