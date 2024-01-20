import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class DataService {

  private _data$: BehaviorSubject<any> = new BehaviorSubject(null);

  constructor(
    private api: ApiService
  ) { }

  public loadData(): void {
    this.api.getUrl('./assets/data.json')
      .subscribe(data => {
        // console.log(data.body);
        this._data$.next(data.body);
      });
  }

  public getData(): BehaviorSubject<any> {
    return this._data$;
  }  
}
