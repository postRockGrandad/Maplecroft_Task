import { TestBed } from '@angular/core/testing';

import { ApiService } from './api.service';
import { HttpResponse } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

let testUrl = "/a/url";
let testData = { some: "json" };

describe('ApiService', () => {
  let service: ApiService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ HttpClientTestingModule ]
    });

    service = TestBed.inject(ApiService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getUrl triggers HTTP GET requests to the provided URL', () => {  
    //trigger GET request
    service.getUrl(testUrl).subscribe(
      (data: HttpResponse<any>) => {
        //verify HttpResponse body
        expect(data.body).toEqual(testData);
      }
    );
  
    //capture request and verify target and method
    const req = httpTestingController.expectOne(testUrl);
    expect(req.request.method).toEqual('GET');
  
    //respond to the request to trigger subscription
    req.flush(testData);
  
    //confirm no more outstanding requests
    httpTestingController.verify();
  });
});

