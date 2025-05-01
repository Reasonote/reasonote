export class UserApiError extends Error {
  constructor(
    public readonly issueDescription: string,
    public readonly howToFixIt: string
  ) {
    super(issueDescription);
  }
}

export class ApplicationApiError extends Error {
  constructor(public readonly reason: string, public readonly data?: any) {
    super(reason);
  }
}
