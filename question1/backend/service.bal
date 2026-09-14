import ballerina/http;
import ballerina/time;

@http:ServiceConfig {
    cors: {
        allowOrigins: ["http://127.0.0.1:5500", "http://localhost:5500"],
        allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowHeaders: ["Content-Type"]
    }
}

service / on new http:Listener(9090) {

   
    // ASSET CRUD
    

    resource function get assets() returns Asset[] {
        return assets.toArray();
    }

    resource function get assets/[string assetTag]()
        returns Asset|http:NotFound {

        Asset? asset = assets[assetTag];

        if asset is Asset {
            return asset;
        }

        return http:NOT_FOUND;
    }



 resource function post assets(
    @http:Payload Asset asset
) returns http:Created|http:Conflict {

    if assets.hasKey(asset.assetTag) {
        return http:CONFLICT;
    }

    assets.put(asset);

    return <http:Created>{
        body: asset
    };
}

    resource function put assets/[string assetTag](
        @http:Payload Asset updatedAsset
    ) returns Asset|http:NotFound|http:BadRequest {

        if !assets.hasKey(assetTag) {
            return http:NOT_FOUND;
        }


    if updatedAsset.assetTag != assetTag {
    return http:BAD_REQUEST;
}
   

        assets.put(updatedAsset);

        return updatedAsset;
    }

    resource function delete assets/[string assetTag]()
        returns http:Ok|http:NotFound {

        if !assets.hasKey(assetTag) {
            return http:NOT_FOUND;
        }

        _ = assets.removeIfHasKey(assetTag);

        return <http:Ok>{
            body: "Asset deleted successfully."
        };
    }


    // FILTERING
   

    resource function get assets/institution/[string institution]()
        returns Asset[] {

        Asset[] result = [];

        foreach Asset asset in assets {
            if asset.institution == institution {
                result.push(asset);
            }
        }

        return result;
    }

    resource function get assets/site/[string site]()
        returns Asset[] {

        Asset[] result = [];

        foreach Asset asset in assets {
            if asset.site == site {
                result.push(asset);
            }
        }

        return result;
    }

  

    // OVERDUE MAINTENANCE
   

    resource function get assets/overdue()
        returns Asset[] {

        Asset[] result = [];

        time:Utc now = time:utcNow();
        string currentDate = now.toString().substring(0, 10);

        foreach Asset asset in assets {

            foreach Schedule schedule in asset.schedules {

                if schedule.scheduleType == "MAINTENANCE" &&
                    schedule.dueDate < currentDate {

                    result.push(asset);
                    break;
                }
            }
        }

        return result;
    }

