import { DataModel } from "../models/data.model";
import { TripleStoreDataModel } from "../models/triple-store-data.model";
import { SearchOptionModel } from "../models/search-option.model";
import { store } from "../store";
import { AddressModel } from "../models/address.model";
import { SourceModel } from "../models/source.model";
import { DocumentModel } from "../models/document.model";
import { PersonModel } from "../models/person.model";
import { LngLatBounds, LngLatLike } from "mapbox-gl";
import { TripleStoreAddressModel } from "../models/triple-store/triple-store-address.model";

export class DataService {
  private static _instance: DataService;

  private readonly BASE_URL =
    "/api.data.netwerkdigitaalerfgoed.nl/queries/hetutrechtsarchief/";
  private readonly POSTFIX = "/run?pageSize=10000";
  private readonly DOCUMENTS_QUERY_URL =
    this.BASE_URL + "wo2-documenten" + this.POSTFIX;
  private readonly ADDRESSES_QUERY_URL =
    this.BASE_URL + "wo2-adressen" + this.POSTFIX;
  private readonly ADDRESSES_PER_DOCUMENT_QUERY_URL =
    this.BASE_URL + "wo2-adressen-per-document" + this.POSTFIX;
  private readonly PERSONS_PER_DOCUMENT_QUERY_URL =
    this.BASE_URL + "wo2-personen-per-document" + this.POSTFIX;
  private readonly PERSONS_QUERY_URL =
    this.BASE_URL + "wo2-personen" + this.POSTFIX;
  private readonly SOURCES_QUERY_URL =
    this.BASE_URL + "wo2-brontypes" + this.POSTFIX;
  private readonly PERSON_ADDRESS_DOCUMENT_QUERY_URL =
    this.BASE_URL + "wo2-persoon-op-adres-per-document" + this.POSTFIX;

  constructor() {
    if (DataService._instance) {
      return DataService._instance;
    }
    DataService._instance = this;
  }

  private async _fetch(url): Promise<any> {
    const rawResponse = await fetch(url, {
      method: "get",
    }).catch((err) => {
      console.error(err);
    });
    if (!rawResponse) {
      console.log("ERROR: Could not retrieve data.");
      return Promise.reject();
    }
    const response = await rawResponse.json();

    return Promise.resolve(response);
  }

  private _buildPageUrl(queryUrl: string, pageIdx: number): string {
    return queryUrl.replace(
      "/run?pageSize=10000",
      `/run!page=${pageIdx}&pageSize=10000`
    );
  }

  private _retrieveFromTripleStore(queryUrl, numPages): Promise<any>[] {
    // TODO: Dynamic check (run for loop until no results are returned anymore)
    const promises: Promise<any>[] = [];
    for (let pageIdx = 1; pageIdx <= numPages; pageIdx++) {
      const paginatedQueryUrl = this._buildPageUrl(queryUrl, pageIdx);
      const promise: Promise<any> = this._fetch(paginatedQueryUrl);
      // TODO: Concat results to results parameter
      promises.push(promise);
    }
    return promises;
  }

  async retrieveAllDataFromTripleStore(): Promise<TripleStoreDataModel> {
    const data: TripleStoreDataModel = {};

    //sources
    data.sources = [];
    const sourcesPromises = this._retrieveFromTripleStore(
      this.SOURCES_QUERY_URL,
      1
    );
    sourcesPromises.forEach((promise) =>
      promise.then(
        (r) => (data.sources = r ? data.sources.concat(r) : data.sources)
      )
    );

    //documents
    data.documents = [];
    const documentsPromises = this._retrieveFromTripleStore(
      this.DOCUMENTS_QUERY_URL,
      2
    );
    documentsPromises.forEach((promise) =>
      promise.then(
        (r) => (data.documents = r ? data.documents.concat(r) : data.documents)
      )
    );

    //persons
    data.persons = [];
    const personsPromises = this._retrieveFromTripleStore(
      this.PERSONS_QUERY_URL,
      2
    );
    personsPromises.forEach((promise) =>
      promise.then(
        (r) => (data.persons = r ? data.persons.concat(r) : data.persons)
      )
    );

    //addresses
    data.addresses = [];
    const addressesPromises = this._retrieveFromTripleStore(
      this.ADDRESSES_QUERY_URL,
      2
    );
    addressesPromises.forEach((promise) =>
      promise.then(
        (r) => (data.addresses = r ? data.addresses.concat(r) : data.addresses)
      )
    );

    //addressesPerDocument
    data.addressesPerDocument = [];
    const addressesPerDocumentPromises = this._retrieveFromTripleStore(
      this.ADDRESSES_PER_DOCUMENT_QUERY_URL,
      2
    );
    addressesPerDocumentPromises.forEach((promise) =>
      promise.then(
        (r) =>
          (data.addressesPerDocument = r
            ? data.addressesPerDocument.concat(r)
            : data.addressesPerDocument)
      )
    );

    //personsPerAddressPerDocument
    data.personsPerAddressPerDocument = [];
    const personsPerAddressPerDocumentPromises = this._retrieveFromTripleStore(
      this.PERSON_ADDRESS_DOCUMENT_QUERY_URL,
      2
    );
    personsPerAddressPerDocumentPromises.forEach((promise) =>
      promise.then(
        (r) =>
          (data.personsPerAddressPerDocument = r
            ? data.personsPerAddressPerDocument.concat(r)
            : data.personsPerAddressPerDocument)
      )
    );

    const dataPromises = [
      ...sourcesPromises,
      ...documentsPromises,
      ...addressesPromises,
      ...personsPromises,
      ...addressesPerDocumentPromises,
      ...personsPerAddressPerDocumentPromises,
    ];
    await Promise.all(dataPromises);
    return data;
  }

  parseDataFromTripleStore(tripleStoreData: TripleStoreDataModel) {
    //create lookup tables
    const sourcesById: { [name: string]: SourceModel } = Object.assign(
      {},
      ...tripleStoreData.sources.map((x) => ({
        [x.sourceId]: x,
      }))
    );

    const documentsById: { [name: string]: DocumentModel } = Object.assign(
      {},
      ...tripleStoreData.documents.map((x) => ({
        [x.docId]: x,
      }))
    );

    const addressesById: { [name: string]: AddressModel } = Object.assign(
      {},
      ...tripleStoreData.addresses.map(
        (tripleStoreAddress: TripleStoreAddressModel) => ({
          [tripleStoreAddress.addressId]: {
            addressId: tripleStoreAddress.addressId,
            label: tripleStoreAddress.label.replace("-BS",""), //fix
            place: tripleStoreAddress.woonplaats,
            streetName: tripleStoreAddress.straatnaam,
            houseLetter: tripleStoreAddress.huisletter,
            houseNumber: tripleStoreAddress.huisnummer,
            houseNumberAddition: tripleStoreAddress.huisnummer_toevoeging,
            coordinates: this._parseGeoCoords(tripleStoreAddress.geo),
          },
        })
      )
    );

    const personsById = Object.assign(
      {},
      ...tripleStoreData.persons.map((x) => ({
        [x.personId]: x,
      }))
    );

    //create arrays
    const sources: SourceModel[] = Object.values(sourcesById);
    const documents: DocumentModel[] = Object.values(documentsById);
    const addresses: AddressModel[] = Object.values(addressesById);
    const persons: PersonModel[] = Object.values(personsById);

    //link documentsById to sourcesById on key 'sourceId'
    for (const id in documentsById) {
      documentsById[id]["sourceItem"] =
        sourcesById[documentsById[id]["sourceId"]];
    }

    //link addresses to documents (and the other vice versa)
    for (const item of tripleStoreData.addressesPerDocument) {
      const doc = documentsById[item.docId];
      const address = addressesById[item.addressId];

      if (!doc) {
        console.log("doc not found: " + item.docId);
      }

      //store address in list with address for certain document
      if (!doc.addresses) doc.addresses = [];
      doc.addresses.push(address);

      //store documents that are associated to this address
      if (!address.documents) address.documents = [];
      address.documents.push(doc);
    }

    // persons per address per document
    for (const item of tripleStoreData.personsPerAddressPerDocument) {
      const doc = documentsById[item.docId];
      const person = personsById[item.personId];
      const address = addressesById[item.addressId];

      //list of persons associated with address on certain document
      if (!doc.personAtAddressItems) doc.personAtAddressItems = [];
      doc.personAtAddressItems.push({
        person: person,
        address: address,
      });

      //be able to get a list of persons associated with an address on any document
      if (!address.persons) address.persons = [];
      address.persons.push(person);
    }

    //store documents per sourceType
    for (const source of sources) {
      source.documents = documents.filter((doc) => {
        return doc.sourceItem == source;
      });
    }

    //store addresses per sourceType
    for (const source of sources) {
      source.addresses = addresses.filter((address) => {
        for (const doc of source.documents) {
          if (
            doc.addresses?.find((o) => {
              return o == address;
            })
          )
            return true;
        }
        return false;
      });
    }

    // for (const source of sources) {
    //   console.log(source.label, "docs=",source.documents.length,"adresses=",source.addresses.length )
    // }

    //parse geo coords from string to LatLonLike
    for (const address of addresses) {
      address.documentCount = address.documents.length;
      // address.coordinates = this._parseGeoCoords(address.geo);
    }

    console.log("all addresses (unique):", addresses.length);
    console.log("all documents:", documents.length);
    console.log("all persons (mentions):", persons.length);
    console.log("all sources:", sources.length);

    return {
      addresses,
      addressesById,
      documents,
      documentsById,
      persons,
      personsById,
      sources,
      sourcesById,
    };
  }

  init() {
    console.log("loading");
    this.retrieveAllDataFromTripleStore()
      .then(async (data) => {
        console.log("linking/parsing");
        const parsedData = this.parseDataFromTripleStore(data);
        store.commit("setAllData", parsedData);
        store.commit("setSources", parsedData.sources); //would it be possible to jst use setAllData ?
      })
      .catch((err) => {
        console.log("error", err);
      });
  }

  resetFilter() {
    const addresses: DataModel = store.getters["getAllData"].addresses;
    store.commit("setFilteredAddresses", addresses);
  }

  private _parseGeoCoords(geo: string | undefined): LngLatLike {
    if (!geo) {
      console.warn(
        "_parseGeoCoords: No coordinates passed... Using center of the Netherlands."
      );
      return [5.2793703, 52.2129919];
    }

    if (geo.includes("polygon")) {
      console.warn(
        "_parseGeoCoords: Can not handle polygon coordinates... Using center of the Netherlands instead.",
        geo
      );
      return [5.2793703, 52.2129919];
    }

    const coordsStr: string[] = geo
      .replace("POINT (", "")
      .replace(")", "")
      .split(" ");
    // @ts-ignore
    const coords: LngLatLike = coordsStr.map((coord: string) => {
      const coordNum: number = parseFloat(coord);
      if (!coordNum) {
        console.log("_parseGeoCoords:", geo, coord, coordNum);
      }
      return coordNum;
    });
    return coords;
  }

  updateFilterFromStore() {
    this.filterAddressesAndDocuments(
      store.getters["getAllData"].addresses,
      store.getters["getAllData"].documents,
      store.getters["getSearchTerm"],
      store.getters["getSearchOption"],
      store.getters["getShownSources"],
      store.getters["getMapBounds"]
    );
  }

  filterAddressesAndDocuments(
    addresses: AddressModel[],
    documents: DocumentModel[],
    searchTerm: string,
    searchOption: SearchOptionModel,
    selectedSources: SourceModel[],
    mapBounds: LngLatBounds | null
  ) {

    //inline helper functions
    const addressFitsInMapBounds = (address: AddressModel) => {
      return mapBounds ? mapBounds.contains(address.coordinates) : true;
    };

    const doesPersonContain = (person, searchTerm) => {
      return person?.label?.toLowerCase().includes(searchTerm.toLowerCase());
    };

    const doesAnyPersonContain = (persons, searchTerm) => {
      if (!persons) return false;
      for (const person of persons) {
        if (doesPersonContain(person, searchTerm)) {
          return true;
        }
      }
      return false;
    };

    const doesAddressContain = (address, searchTerm) => {
      return address.label?.toLowerCase().includes(searchTerm.toLowerCase());
    };

    let filteredAddresses = addresses.filter((address) => {
      for (const source of selectedSources) {
        // console.log("source",source,"source.addresses",source.addresses)
        if (source.addresses?.indexOf(address) != -1) {
          return true;
        }
      }
      return false;
    });
   
    // filter addresses on map bounds
    filteredAddresses = filteredAddresses.filter(addressFitsInMapBounds);

    //filter addresses on searchTerm

    if (searchTerm) {
      //filter by all: either persons or addresses
      if (searchOption === SearchOptionModel.All) {
        filteredAddresses = filteredAddresses.filter((address) => {
          return (
            doesAnyPersonContain(address.persons, searchTerm) ||
            doesAddressContain(address, searchTerm)
          );
        });
      }

      //filter by person name
      else if (searchOption === SearchOptionModel.People) {
        filteredAddresses = filteredAddresses.filter((address) => {
          return doesAnyPersonContain(address.persons, searchTerm);
        });
      }

      //filter by address
      else if (searchOption === SearchOptionModel.Addresses) {
        filteredAddresses = filteredAddresses.filter((address) => {
          return doesAddressContain(address, searchTerm);
        });
      } else {
        throw new Error("Unknown searchOption: " + searchOption);
      }
    }

    //filteredDocuments in filteredAddress

    for (const address of filteredAddresses) {
      address.filteredDocuments = address.documents.filter(
        (doc: DocumentModel) => {

          // is doc in one the selected sources?
          if (selectedSources.indexOf(doc.sourceItem)==-1) return false;

          // daarna pas personen en search options etc controleren
          const persons = doc.personAtAddressItems
            ? doc.personAtAddressItems.map(
                (personAddressItem) => personAddressItem.person
              )
            : [];

          if (searchOption === SearchOptionModel.All) {
            if (
              doesAddressContain(address, searchTerm) ||
              doesAnyPersonContain(persons, searchTerm)
            )
              return true;
          } else if (searchOption === SearchOptionModel.People) {
            if (doesAnyPersonContain(persons, searchTerm)) return true;
          } else if (searchOption === SearchOptionModel.Addresses) {
            if (doesAddressContain(address, searchTerm)) return true;
          }          
        }
      );
      // .length = 0; //clear array
      // for (const doc of address.documents) {
      //
      // }
    }

    // update documentCount
    for (const address of filteredAddresses) {
      address.documentCount = address.filteredDocuments.length;
    }

    store.commit("setFilteredAddresses", filteredAddresses);

  }
}
