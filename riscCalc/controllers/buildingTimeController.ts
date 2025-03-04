import { BuildingsTypes, ProcessedZone, ProcessedRoute} from '../interfaces/interfaces';


function time () {
    const date = new Date();
    const hours = date.getHours();
    let minutes = date.getMinutes();
    minutes = (minutes*100)/60;
    let time = hours + minutes;
    return time;
}

export const checkTimeForBuilding=(building: BuildingsTypes):  BuildingsTypes=> {
    switch (building.type) {
        case "school":
        case "university":
            if(time()==8.5 || time()==10.5|| time()==12.5 || time()==14.5 || time()==16.5 || time()==18.5){
                building.pedestrian+=10;
                building.car+=10;
            }
            break;
        case "bank":
        case "dentist":
        case "social_facility":
        case "post_box":
        case "bureau_de_change":
        case "veterinary":
            if(time()<9 || time()>17){
                building.pedestrian-=3;
                building.car-=3;
            }
        default:
            return building;
    }
    return building;
}