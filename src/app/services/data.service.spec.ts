import { TestBed } from '@angular/core/testing';

import { DataService } from './data.service';
import { HttpClientModule } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing'

describe('DataService', () => {
  let service: DataService;
  let httpTestingController: HttpTestingController;
  let testData = { some: "json" };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientModule, HttpClientTestingModule],
      providers: [DataService]
    });
    service = TestBed.inject(DataService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('initialises the data state as null', ()=>{
    service.getData().subscribe(data => {
      expect(data).toEqual(null);
    });
  });

  it('triggers a HTTP request for the API data when loadData is called', () => {  
    //trigger data load request
    service.loadData();
    //capture request and verify target and method
    const req = httpTestingController.expectOne("./assets/data.json");
    expect(req.request.method).toEqual('GET');
  });

  it('updates the data state with the API response', () => {
    //trigger data load request
    service.loadData();

    //respond to request with data
    httpTestingController.expectOne("./assets/data.json").flush(testData);
    //confirm no more outstanding requests
    httpTestingController.verify();

    //subscribe after responding to request as BehaviourSubject starts with null value until API response updates state
    service.getData().subscribe(data => {
      //verify response
      expect(data).toEqual(testData);
    });
  });
});